#!/usr/bin/env python3
"""
T8 — merge the QLoRA adapter into the base model and export a full fp16
checkpoint, ready for T9's evaluation and T11's GGUF quantisation.

Runs entirely on CPU, on purpose:

  * A 3B model in fp16 is ~6.2GB — it does not fit in the RTX 3050's 6GB
    alongside anything else, and there is no reason to make the merge
    compete with the training run for VRAM.
  * The Oracle box in T10/T11 can therefore run this step without a GPU.

It also merges into the *fp16* base rather than the 4-bit one training ran
against. The adapter was trained against NF4-quantised weights (that is what
QLoRA does), but folding it back into full-precision weights is the standard
merge and avoids baking the quantisation error into the exported model —
T11 re-quantises from this artifact anyway. `--base-model` maps automatically
from Unsloth's `-bnb-4bit` repo to its fp16 counterpart.

Usage
-----
    python scripts/ml/merge_and_export.py
    python scripts/ml/merge_and_export.py --adapter-dir path/to/adapter --output-dir path/to/out

Needs ~7GB free RAM and ~6.2GB free disk for the output (plus ~6.2GB in the
HuggingFace cache for the fp16 base on first run).
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

from prompt_format import build_ollama_modelfile

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ADAPTER = SCRIPT_DIR / "outputs" / "qwen2.5-coder-3b-platypus-lora"
DEFAULT_OUTPUT = SCRIPT_DIR / "outputs" / "qwen2.5-coder-3b-platypus-merged"

GB = 1024**3


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--adapter-dir", type=Path, default=DEFAULT_ADAPTER)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--base-model",
        default=None,
        help="fp16 base repo (default: read from the adapter config, with any "
        "-bnb-4bit suffix stripped)",
    )
    parser.add_argument(
        "--dtype",
        choices=["float16", "bfloat16"],
        default="float16",
        help="export dtype (default: float16 — llama.cpp's convert script expects it)",
    )
    parser.add_argument("--max-shard-size", default="4GB")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate the adapter and resolve the base model, then stop before loading weights",
    )
    return parser.parse_args()


def resolve_base_model(adapter_dir: Path, override: str | None) -> str:
    """Find the fp16 base this adapter was trained against."""
    config_path = adapter_dir / "adapter_config.json"
    if not config_path.exists():
        raise SystemExit(
            f"No adapter_config.json in {adapter_dir} — run scripts/ml/train_qlora.py first."
        )
    config = json.loads(config_path.read_text(encoding="utf-8"))

    if override:
        return override

    base = config.get("base_model_name_or_path")
    if not base:
        raise SystemExit(f"{config_path} has no base_model_name_or_path; pass --base-model explicitly.")

    # Training loads Unsloth's pre-quantised mirror; merge into its fp16 twin.
    if base.endswith("-bnb-4bit"):
        fp16_base = base[: -len("-bnb-4bit")]
        print(f"  adapter base:  {base}")
        print(f"  merging into:  {fp16_base}  (fp16 counterpart)")
        return fp16_base

    print(f"  merging into:  {base}")
    return base


def write_ollama_modelfile(output_dir: Path) -> Path:
    """Emit the Ollama Modelfile that reproduces training-time ChatML exactly.

    This closes the one real train/serve gap in T8. Production posts to
    Ollama's /api/generate with buildPrompt()'s output as a single flat
    `prompt` string, which Ollama substitutes into `{{ .Prompt }}` — so
    without a pinned template the persona+rules would land in the *user*
    turn, while training put them in a *system* turn. Same characters,
    different ChatML, and the model would be running off-distribution.

    Pinning SYSTEM + TEMPLATE here makes the serving-side shape a build
    artifact rather than something T11 has to rediscover. It also means
    lib/ollama.ts's buildPrompt() must send ONLY its per-request half
    (the `Compiler error:` / `Offending line:` lines) once this model is
    live — the persona+rules now come from SYSTEM. See README.md.

    The content itself is built by prompt_format.build_ollama_modelfile(),
    which the test suite renders and compares against the training template.
    """
    path = output_dir / "Modelfile"
    path.write_text(build_ollama_modelfile(), encoding="utf-8")
    return path


def main() -> int:
    args = parse_args()

    print("=" * 78)
    print("T8 — merge LoRA adapter -> full fp16 checkpoint")
    print("=" * 78)

    if not args.adapter_dir.exists():
        raise SystemExit(f"Adapter directory not found: {args.adapter_dir}")

    print("\n[1/5] Resolving the base model ...")
    base_model_name = resolve_base_model(args.adapter_dir, args.base_model)
    adapter_config = json.loads((args.adapter_dir / "adapter_config.json").read_text(encoding="utf-8"))
    print(f"  LoRA r={adapter_config.get('r')} alpha={adapter_config.get('lora_alpha')}")
    print(f"  target modules: {sorted(adapter_config.get('target_modules', []))}")

    if args.dry_run:
        print("\n--dry-run: adapter validated and base resolved; stopping before the merge.")
        return 0

    dtype = getattr(torch, args.dtype)

    print(f"\n[2/5] Loading the base model on CPU in {args.dtype} (~6.2GB, first run downloads it) ...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=dtype,
        device_map="cpu",
        low_cpu_mem_usage=True,
    )

    # Snapshot one LoRA-targeted weight and one untargeted weight so the merge
    # can be proven to have actually changed the right tensors.
    probe_targeted = model.model.layers[0].self_attn.q_proj.weight.detach().clone()
    probe_untouched = model.model.embed_tokens.weight[:8].detach().clone()

    print("\n[3/5] Applying and merging the adapter ...")
    model = PeftModel.from_pretrained(model, str(args.adapter_dir), torch_dtype=dtype)
    model = model.merge_and_unload()

    merged_targeted = model.model.layers[0].self_attn.q_proj.weight.detach()
    merged_untouched = model.model.embed_tokens.weight[:8].detach()
    targeted_delta = (merged_targeted.float() - probe_targeted.float()).abs().max().item()
    untouched_delta = (merged_untouched.float() - probe_untouched.float()).abs().max().item()
    print(f"  q_proj max |delta|:      {targeted_delta:.3e}  (must be > 0 — the adapter was applied)")
    print(f"  embed_tokens max |delta|: {untouched_delta:.3e}  (must be 0 — untargeted weights untouched)")
    if targeted_delta == 0.0:
        raise SystemExit(
            "Merge produced no change in a LoRA-targeted weight. The adapter is empty or did not "
            "attach — refusing to export a checkpoint identical to the base model."
        )
    if untouched_delta != 0.0:
        raise SystemExit("Merge modified an untargeted weight (embed_tokens) — aborting.")

    print("\n[4/5] Saving the merged checkpoint ...")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(
        str(args.output_dir),
        safe_serialization=True,
        max_shard_size=args.max_shard_size,
    )

    # Prefer the tokenizer saved next to the adapter (it is the exact one
    # training used); fall back to the base repo's.
    tokenizer_source = args.adapter_dir if (args.adapter_dir / "tokenizer_config.json").exists() else base_model_name
    tokenizer = AutoTokenizer.from_pretrained(str(tokenizer_source))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"  tokenizer from: {tokenizer_source}")

    written = sum(p.stat().st_size for p in args.output_dir.rglob("*") if p.is_file())
    print(f"  wrote {written / GB:.2f} GB -> {args.output_dir}")

    modelfile_path = write_ollama_modelfile(args.output_dir)
    print(f"  Ollama Modelfile -> {modelfile_path}")

    print("\n[5/5] Next step (T11 — GGUF quantisation)")
    print("  The merged checkpoint is a standard HuggingFace fp16 model directory.")
    print("  Convert and quantise it with llama.cpp:")
    print()
    print("    git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp")
    print("    pip install -r requirements.txt")
    print(f"    python convert_hf_to_gguf.py {args.output_dir} \\")
    print(f"        --outfile qwen2.5-coder-3b-platypus-f16.gguf --outtype f16")
    print("    cmake -B build && cmake --build build --config Release -j")
    print("    ./build/bin/llama-quantize qwen2.5-coder-3b-platypus-f16.gguf \\")
    print("        qwen2.5-coder-3b-platypus-q4_k_m.gguf Q4_K_M")
    print()

    free_disk = shutil.disk_usage(args.output_dir).free
    print(f"  ({free_disk / GB:.1f} GB free on this volume)")
    print("=" * 78)
    print("RESULT: PASS — merged checkpoint exported.")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())
