# T11 — GGUF Quantization & Oracle Deploy

GitHub: [#11](../../../issues/11) — `wayfinder:task`

**Blocked by:** T9 (LLM-as-Judge Evaluation), T10 (Oracle Cloud Provisioning)
**Blocks:** T12 (CI/CD & Docker Compose Wiring)

## Question

Quantize T8's fine-tuned (and T9-approved) model to GGUF Q4_K_M, transfer it to the Oracle
instance from T10, and stand it up as `qwen2.5-coder-platypus:3b` served by Ollama.

## Scope

- Quantize the merged model to GGUF, Q4_K_M — target ~2.0GB per doc 1/doc 2's sizing.
- Securely transfer the weights to the Oracle instance from T10 (scp/rsync over the SSH access
  T10 established — never through a public URL or committed to the repo).
- Install Ollama on the instance (`wizard` skill, per doc 2's TASK-5.1), configure it as a
  systemd service so it survives reboots, and load the quantized model under the exact tag
  `qwen2.5-coder-platypus:3b` — this tag is already hardcoded as the default in
  `lib/env-validation.ts`'s `OLLAMA_MODEL`.
- Smoke-test: a raw HTTP request to the instance's Ollama REST API returns a valid
  `{ explanation, direct_fix }` completion for a sample GCC error.

## Mandatory: re-evaluate the GGUF before it is considered deployable

The quantization half of this ticket was run locally while T10 was blocked, and it surfaced a
bug that would otherwise have deployed a completely dead model to Oracle under a green T9
report. Full write-up in `scripts/ml/README.md` → "Incident: a corrupt base download silently
destroyed the merged model". Summary:

- A `hf_transfer` "fast download" wrote a full-size, non-sparse, partly **zero-filled** 4.6GB
  shard of the fp16 base. No error, no `.incomplete` marker, not sparse.
- `merge_and_export.py` merged the good adapter into those zeros — LoRA-targeted attention
  projections became only the tiny LoRA delta. The merged checkpoint, its f16 GGUF and its
  Q4_K_M all emitted a single token forever.
- **T9's 100% PASS did not cover this.** T9 evaluates `outputs/...-lora` (the adapter, against
  the intact 4-bit base) by default. It never evaluated the merged checkpoint or the GGUF —
  the artifacts that actually ship.

`merge_and_export.py` now hash-verifies the base shards against their content-addressed cache
blob names and aborts on any all-zero/non-finite 2-D weight tensor
(`scripts/ml/test_merge_and_export.py`, 9 tests). That closes the silent-corruption path, but
the process rule matters more than the guard: **the quality gate must run against the artifact
that ships.**

So this ticket does not close on a hand-written smoke test. After the model is loaded on the
instance, run the same 500-sample evaluation against the live Ollama endpoint:

```bash
scripts/ml/.venv/Scripts/python scripts/ml/evaluate_model.py \
    --backend ollama --ollama-url http://<instance>:11434 \
    --ollama-model qwen2.5-coder-platypus:3b
```

A destroyed model fails this in the first 10 samples (`--smoke`).

## Definition of done

- [ ] GGUF Q4_K_M model file produced, ~2.0GB
- [ ] Base-model integrity verified before the merge (sha256 of each cached shard matches its
      blob name) — `merge_and_export.py` now enforces this and aborts otherwise
- [ ] Ollama running as a systemd service on the Oracle instance, model loaded under
      `qwen2.5-coder-platypus:3b`
- [ ] Smoke-tested via direct HTTP call — real completion returned, matching T3's schema
- [ ] **`evaluate_model.py --backend ollama` re-run against the deployed endpoint and passing
      the same gates T9 set (schema 100%, clarity ≥98%, code isolation 100%, ≤3 sentences)**
- [ ] Instance endpoint recorded in the resolution comment for T12 to consume
