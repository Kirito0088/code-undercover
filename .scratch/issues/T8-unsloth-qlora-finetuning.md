# T8 — Unsloth QLoRA Fine-Tuning (Dell G15, RTX 3050)

GitHub: [#8](../../../issues/8) — `wayfinder:task`

**Blocked by:** T7 (Synthetic Dataset Generation)
**Blocks:** T9 (LLM-as-Judge Evaluation)

## Question

Fine-tune `Qwen2.5-Coder 3B Instruct` on T7's dataset using Unsloth 4-bit QLoRA, on this machine's
RTX 3050 (6GB VRAM), staying within the ≤4.4GB VRAM budget from doc 2's KPI table.

## Scope

- Verified locally executable: CUDA 12.1 + PyTorch 2.5.1 already installed and the GPU visible
  (`nvidia-smi` → RTX 3050, 6144MiB). `unsloth` is **not** yet installed — install it as part of
  this ticket.
- QLoRA config targeting the ≤4.4GB VRAM ceiling (1.6GB headroom per doc 2) — batch size,
  gradient accumulation, and sequence length chosen to fit, not assumed.
- Train against T7's JSONL, using its train/val split.
- Output: LoRA adapter weights + a merge step producing a full fp16 (or bf16) merged model, ready
  for T9's evaluation and T11's quantization.

## Definition of done

- [x] `unsloth` installed and training runs to completion on this machine
- [x] Peak VRAM usage logged and stays ≤4.4GB
- [x] Merged model artifact saved and linked from this ticket (path or storage location — the
      model itself doesn't belong in this issue)
- [x] Training run's loss curve / basic metrics recorded for T9 to sanity-check against

## Outcome

Done in `f477a4a`. See `scripts/ml/README.md` for the exact commands.

| | |
|---|---|
| Peak VRAM | **2.861 GB** / 4.4 GB budget (1.539 GB headroom) |
| Run | 1 epoch, 563 steps, 39.8 min, RTX 3050 6GB Laptop |
| Loss | 1.8727 → 0.0125 (final train loss 0.0862) |
| Eval loss | 0.0212 on T7's 500-row val split |
| Trainable | 14,966,784 / 3,100,905,472 (0.48%) |

`train_qlora.py` enforces the VRAM KPI — it exits non-zero if peak reserved memory crosses
`--vram-budget-gb`, so the number above is a gate rather than a reading.

**Artifacts** (gitignored — too large for git; regenerate with the README's commands):

- LoRA adapter: `scripts/ml/outputs/qwen2.5-coder-3b-platypus-lora/` (30MB)
- Merged fp16: `scripts/ml/outputs/qwen2.5-coder-3b-platypus-merged/` (5.76GB, 2 shards) —
  this is T11's GGUF input and T9's eval target
- Ollama Modelfile: `…-merged/Modelfile` — pins SYSTEM/TEMPLATE so serving-time ChatML
  matches training
- Metrics (**committed**): `scripts/ml/outputs/qwen2.5-coder-3b-platypus-lora/training_summary.json`
  — 563-point loss curve, VRAM figures, resolved config, package versions

## Carried into T11 / T9

1. **T11 — production prompt must be split.** `lib/ollama.ts` posts one flat string to
   `/api/generate`, so Ollama puts persona+rules in the *user* turn while training put them in
   a *system* turn. T11 must deploy with the emitted `Modelfile` **and** change `buildPrompt()`
   to send only its per-request half (`Compiler error:` / `Offending line:`), or the persona is
   sent twice. A test asserts the Modelfile renders byte-identically to the training prompt.
2. **T9 — untested prompt variant.** `app/api/compiler/explain/route.ts` forwards a
   client-supplied `errorType`, which makes `buildPrompt()` append
   `Known error category: <type>`. No training row has that line (T7's rows carry no error-type
   field). If T9's eval shows degradation with it present, regenerate a fraction of rows using
   `build_user_turn(row, error_type=...)` rather than changing the prompt.
