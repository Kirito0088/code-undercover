# `scripts/ml` — Platypus SLM training pipeline

The T7 dataset generator and the T8 QLoRA fine-tune of
`Qwen2.5-Coder-3B-Instruct`, which teaches the model to turn a raw GCC
diagnostic into the `{explanation, direct_fix}` JSON that
`lib/explainService.ts` serves.

| File | Ticket | What it does |
|---|---|---|
| `generate_dataset.py` | T7 | Builds the 5,000-row synthetic dataset |
| `verify_dataset.py` | T7 | Schema + 3-sentence-cap verification |
| `prompt_format.py` | T8 | Row → Qwen2.5 ChatML training example |
| `test_prompt_format.py` | T8 | Pins the prompt contract (32 tests) |
| `train_qlora.py` | T8 | The 4-bit QLoRA fine-tune |
| `merge_and_export.py` | T8 | Adapter → merged fp16 checkpoint for T9/T11 |

## Setup

Two steps, and they are not interchangeable — `pip install -r` alone would
try to resolve Unsloth's declared `xformers` dependency, which has no
Windows wheel built against torch 2.5.1. Unsloth imports xformers inside a
`try/except` and falls back to PyTorch SDPA attention, so `--no-deps` is the
supported path here.

```bash
python -m venv scripts/ml/.venv
```

```bash
scripts/ml/.venv/Scripts/python -m pip install -r scripts/ml/requirements.txt
```

```bash
scripts/ml/.venv/Scripts/python -m pip install --no-deps unsloth==2026.8.18 unsloth_zoo==2026.8.12
```

Use an **isolated** venv, not `--system-site-packages`: `transformers`
imports TensorFlow whenever it can see one, and an unrelated global
TF/protobuf pair is enough to break `import trl` outright.

On Linux (T10/T11's Oracle box) swap `Scripts/` for `bin/`; `xformers`
installs cleanly there and can be added back for a modest speed-up.

## Running the fine-tune

Smoke test first — 10 steps, ~1 minute, proves the VRAM budget and that the
loss moves before committing to the full run:

```bash
scripts/ml/.venv/Scripts/python scripts/ml/train_qlora.py --smoke
```

The real run — 1 epoch over all 4,500 training rows:

```bash
scripts/ml/.venv/Scripts/python scripts/ml/train_qlora.py
```

Then merge the adapter into a full fp16 checkpoint for T9's eval and T11's
GGUF quantisation (CPU-only; needs ~7GB RAM and ~13GB disk including the
base-model download):

```bash
scripts/ml/.venv/Scripts/python scripts/ml/merge_and_export.py
```

Unit tests for the prompt contract:

```bash
scripts/ml/.venv/Scripts/python -m pytest scripts/ml/test_prompt_format.py -q
```

## Measured results (Dell G15, RTX 3050 6GB Laptop)

From the 1-epoch run committed in
`outputs/qwen2.5-coder-3b-platypus-lora/training_summary.json`:

| Metric | Value |
|---|---|
| Peak VRAM | **2.861 GB** (budget 4.4 GB — 1.54 GB headroom) |
| Base model resident | 2.00 GB |
| Wall time | 39.8 min (563 steps) |
| Loss | 1.8727 → 0.0125 (final train loss 0.0862) |
| Eval loss | 0.0212 (500-row val split) |
| Trainable params | 14,966,784 / 3,100,905,472 (0.48%) |
| Token lengths | mean 211, p99 228, max 230 — 0% truncated at 512 |

`train_qlora.py` exits non-zero if peak VRAM exceeds `--vram-budget-gb`, so
doc 2's KPI is enforced by the run rather than just reported.

## Why these settings

The 4.4GB ceiling on a 6GB card drove every memory-relevant default:

- **`load_in_4bit=True`** — 3B params in ~2.0GB of NF4 weights.
- **`max_seq_length=512`** — the dataset's longest row tokenises to 230, so
  a 2048 context would buy nothing and cost activation memory. The script
  audits the real length distribution at startup and refuses to train if
  more than `--max-truncation-frac` of rows would be truncated, because a
  truncated row teaches the model to emit JSON that never closes.
- **batch 2 × grad-accum 4** — effective batch 8.
- **`gradient_checkpointing="unsloth"`** — Unsloth's offloaded variant.
- **`optim="adamw_8bit"`** — optimiser state in 8-bit.
- **LoRA r=8, alpha=16** on all 7 attention + MLP projections.

## The prompt contract

`prompt_format.py` is a separate, test-pinned module because a wrong
template is the failure mode that *still trains*: loss falls, the run looks
healthy, and the damage only surfaces as a bad model in T9's eval.

Two invariants guard it:

1. **Train/serve alignment.** `SYSTEM_PROMPT + "\n\n" + build_user_turn(row)`
   reconstructs `lib/ollama.ts`'s `buildPrompt()` output character-for-character.
   The test suite parses that TypeScript and fails if the two ever drift, so
   the fine-tune can't end up optimising a prompt production never sends.
2. **Tokenizer parity.** `train_qlora.py` asserts `render_chatml()` is
   byte-identical to the Qwen2.5-Coder tokenizer's own chat template before
   training starts, and aborts otherwise.

Loss is computed over the assistant turn only (Unsloth's
`train_on_responses_only`), so the model isn't scored on reciting the system
prompt back.

## Required production change before this model goes live

**The one real train/serve gap in T8, and it is not fixable inside T8.**

`lib/ollama.ts` posts to Ollama's `/api/generate` with `buildPrompt()`'s
output as a single flat `prompt` string. Ollama substitutes that whole string
into its Modelfile template's `{{ .Prompt }}`, so persona + rules + error +
line would all land in the **user** turn — whereas training puts persona and
rules in a **system** turn. Identical characters, different ChatML, model
running off-distribution.

`merge_and_export.py` therefore writes an Ollama `Modelfile` next to the
merged checkpoint, pinning `SYSTEM` and `TEMPLATE` to reproduce training-time
ChatML exactly. For that to line up, T11 must deploy with that Modelfile
**and** `buildPrompt()` must send only its per-request half — the
`Compiler error:` / `Offending line:` lines — because the persona and rules
now arrive via `SYSTEM`. Leaving `buildPrompt()` as-is would send the
persona twice.

The split point is already in code: `SYSTEM_PROMPT` and `build_user_turn()`
in `prompt_format.py` are exactly the two halves, and a test asserts they
still concatenate back to today's `buildPrompt()` output.

## Known gap for T9 to probe

`app/api/compiler/explain/route.ts` forwards a client-supplied `errorType`
into `buildPrompt()`, which appends a third line:
`Known error category: <type>`. No training row contains that line — T7's
rows carry no error-type field, so `build_user_turn()` defaults
`error_type=None`. The model is therefore untested against that variant.
`build_user_turn(row, error_type=...)` already accepts it, so if T9's eval
shows degradation when the line is present, the fix is to regenerate a
fraction of the training rows with it rather than to change the prompt.

## Handoff to T9 / T11

- **Adapter:** `outputs/qwen2.5-coder-3b-platypus-lora/` (30MB, gitignored)
- **Merged fp16:** `outputs/qwen2.5-coder-3b-platypus-merged/` (~6.2GB, gitignored)
- **Metrics:** `outputs/*/training_summary.json` — committed; holds the full
  563-point loss curve, VRAM figures, and resolved config for T9 to
  sanity-check against.
- `prompt_format.build_inference_prompt()` and `parse_completion()` are the
  matching inference-side helpers, so T9 evaluates against exactly the
  prompt and strictness the model was trained for.

`merge_and_export.py` prints the exact `llama.cpp` convert + quantise
commands for T11 when it finishes.
