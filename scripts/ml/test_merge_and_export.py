#!/usr/bin/env python3
"""
Tests for scripts/ml/merge_and_export.py's corruption guards.

These exist because of a real incident that reached the end of the pipeline
before anyone noticed. A "fast download" (hf_transfer) wrote a full-size,
non-sparse 4.6GB shard of the fp16 base whose contents were partly
zero-filled — no exception, no `.incomplete` marker. The adapter merged
cleanly into those zeros, so the LoRA-targeted attention projections in the
affected layers ended up as nothing but the tiny LoRA delta. The exported
checkpoint, its f16 GGUF and its Q4_K_M quantisation were all dead (the
model emitted a single token forever), and the pre-existing merge-delta
probes reported PASS the whole way:

  * `targeted_delta > 0` passed — a delta added to zero is still a delta.
  * `untouched_delta == 0` passed — an untargeted zero tensor is unchanged.

Both probes verify the merge *operation*; neither verifies that the weights
being merged into were *sane*. That is the exact gap these two guards close,
so the regressions pinned here are:

  1. A corrupt cache blob (content hash != its content-addressed filename)
     aborts the run *before* the merge, with the blob path in the message.
  2. An all-zero 2-D weight matrix aborts the run, whatever produced it —
     no healthy transformer has one.

Run:
    python -m pytest scripts/ml/test_merge_and_export.py -q
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import pytest
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from merge_and_export import assert_no_dead_weights, verify_cached_base_integrity


# ── helpers ──────────────────────────────────────────────────────────────


class _TinyModel(torch.nn.Module):
    """Two projections and a norm — enough to exercise the ndim filter."""

    def __init__(self) -> None:
        super().__init__()
        self.q_proj = torch.nn.Linear(8, 8, bias=True)
        self.o_proj = torch.nn.Linear(8, 8, bias=False)
        self.norm = torch.nn.Parameter(torch.zeros(8))  # 1-D, legitimately zero


def _write_content_addressed(directory: Path, payload: bytes) -> Path:
    """Write `payload` to a file named after its own sha256 (a valid blob)."""
    name = hashlib.sha256(payload).hexdigest()
    path = directory / name
    path.write_bytes(payload)
    return path


# ── 1. assert_no_dead_weights ────────────────────────────────────────────


def test_healthy_model_passes():
    model = _TinyModel()
    with torch.no_grad():
        model.q_proj.weight.fill_(0.02)
        model.o_proj.weight.fill_(-0.03)
    assert_no_dead_weights(model, "in a healthy test model")  # must not raise


def test_all_zero_two_dim_weight_is_rejected():
    # The exact corruption signature: a projection matrix of pure zeros.
    model = _TinyModel()
    with torch.no_grad():
        model.q_proj.weight.fill_(0.02)
        model.o_proj.weight.zero_()

    with pytest.raises(SystemExit) as excinfo:
        assert_no_dead_weights(model, "in the loaded base model")
    message = str(excinfo.value)
    assert "o_proj.weight" in message
    assert "in the loaded base model" in message


def test_zero_biases_and_norms_are_allowed():
    # Biases and RMSNorm weights are 1-D and can legitimately be all-zero;
    # flagging them would make the guard unusable on a real checkpoint.
    model = _TinyModel()
    with torch.no_grad():
        model.q_proj.weight.fill_(0.02)
        model.o_proj.weight.fill_(0.02)
        model.q_proj.bias.zero_()
        model.norm.zero_()
    assert_no_dead_weights(model, "with zeroed 1-D params")  # must not raise


@pytest.mark.parametrize("bad_value", [float("nan"), float("inf")])
def test_non_finite_weights_are_rejected(bad_value):
    model = _TinyModel()
    with torch.no_grad():
        model.q_proj.weight.fill_(0.02)
        model.o_proj.weight.fill_(0.02)
        model.q_proj.weight[0][0] = bad_value

    with pytest.raises(SystemExit) as excinfo:
        assert_no_dead_weights(model, "in the merged model")
    assert "NaN/Inf" in str(excinfo.value)


# ── 2. verify_cached_base_integrity ──────────────────────────────────────


def _patch_cached_file(monkeypatch, index_path, shard_paths):
    """Stand in for transformers' cached_file() with a fixed resolution map."""
    import transformers.utils

    def fake_cached_file(repo, filename, **kwargs):
        if filename == "model.safetensors.index.json":
            return str(index_path) if index_path else None
        return str(shard_paths[filename])

    monkeypatch.setattr(transformers.utils, "cached_file", fake_cached_file)


def test_intact_shards_pass(tmp_path, monkeypatch, capsys):
    blob = _write_content_addressed(tmp_path, b"pretend safetensors payload")
    index = tmp_path / "index.json"
    index.write_text('{"weight_map": {"a.weight": "model-00001-of-00001.safetensors"}}', encoding="utf-8")
    _patch_cached_file(monkeypatch, index, {"model-00001-of-00001.safetensors": blob})

    verify_cached_base_integrity("unsloth/Qwen2.5-Coder-3B-Instruct")  # must not raise
    assert "sha256 OK" in capsys.readouterr().out


def test_corrupt_shard_aborts_with_the_blob_path(tmp_path, monkeypatch):
    # Simulate the incident: a full-size blob whose bytes no longer hash to
    # the sha256 its filename promises.
    blob = _write_content_addressed(tmp_path, b"the originally downloaded bytes")
    blob.write_bytes(b"zero-filled by a broken fast download\x00\x00\x00")
    index = tmp_path / "index.json"
    index.write_text('{"weight_map": {"a.weight": "model-00001-of-00002.safetensors"}}', encoding="utf-8")
    _patch_cached_file(monkeypatch, index, {"model-00001-of-00002.safetensors": blob})

    with pytest.raises(SystemExit) as excinfo:
        verify_cached_base_integrity("unsloth/Qwen2.5-Coder-3B-Instruct")

    message = str(excinfo.value)
    assert "CORRUPT base weight shard" in message
    assert str(blob) in message, "the abort must name the blob to delete"
    assert "HF_HUB_ENABLE_HF_TRANSFER=0" in message, "the fix must be spelled out"


def test_every_shard_in_the_index_is_checked(tmp_path, monkeypatch):
    # A multi-shard base must not stop at the first shard — the incident's
    # corruption was in shard 1 of 2 while shard 2 hashed clean.
    good = _write_content_addressed(tmp_path, b"shard one bytes")
    bad = _write_content_addressed(tmp_path, b"shard two bytes")
    bad.write_bytes(b"corrupted")
    index = tmp_path / "index.json"
    index.write_text(
        '{"weight_map": {"a.weight": "model-00001-of-00002.safetensors",'
        ' "b.weight": "model-00002-of-00002.safetensors"}}',
        encoding="utf-8",
    )
    _patch_cached_file(
        monkeypatch,
        index,
        {"model-00001-of-00002.safetensors": good, "model-00002-of-00002.safetensors": bad},
    )

    with pytest.raises(SystemExit) as excinfo:
        verify_cached_base_integrity("unsloth/Qwen2.5-Coder-3B-Instruct")
    assert "model-00002-of-00002.safetensors" in str(excinfo.value)


def test_non_content_addressed_paths_are_skipped_not_failed(tmp_path, monkeypatch, capsys):
    # A local directory or non-symlinked cache has no authoritative hash to
    # compare against; that is a "cannot check", not a "corrupt".
    shard = tmp_path / "model.safetensors"
    shard.write_bytes(b"local checkout, not a cache blob")
    _patch_cached_file(monkeypatch, None, {"model.safetensors": shard})

    verify_cached_base_integrity("./some/local/dir")  # must not raise
    out = capsys.readouterr().out
    assert "skipped" in out
    assert "integrity unchecked" in out
