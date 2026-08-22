# T9 — LLM-as-Judge Evaluation Harness

GitHub: [#9](../../../issues/9) — `wayfinder:task`

**Blocked by:** T8 (Unsloth QLoRA Fine-Tuning)
**Blocks:** T11 (GGUF Quantization & Oracle Deploy)

## Question

Run TASK-3.2's LLM-as-a-Judge benchmark against T8's fine-tuned model: does it meet the bar to
ship, or does T8 need another training pass?

## Scope

- 500 held-out test samples (from T7's val split, or a fresh held-out set if the val split is
  smaller than 500).
- Judge scores each response for: age-appropriate tone (grade 8–12 reading level), zero jargon
  leakage, strict JSON schema validity (`{ explanation, direct_fix }` — T3's live contract, not
  doc 1's shape), and absence of unsolicited full-solution code fixes.
- Success bar from doc 2: **100% JSON schema compliance** and **≥98% pedagogical clarity score**
  across the 500 samples.
- If the bar isn't met, this ticket's resolution should say so plainly and specify what's wrong
  (schema drift, tone, hallucinated fixes) — that's a real finding, not a failure to hide.

## Definition of done

- [x] Benchmark harness built (`scripts/ml/evaluate_model.py`) and run against T8's model
- [x] Pass/fail against the 100% schema / ≥98% clarity bar recorded
- [x] Specific metrics, failure modes, and `error_type` prompt variant probe documented in `scripts/ml/evaluation_report.md`

## Outcome

**Verdict: PASS — Ready for T11 (GGUF Quantization & Oracle Deploy)**

| Metric | Target | Measured Score | Status |
|---|---|---|---|
| **JSON Schema Adherence** | 100.0% | **100.0%** (500/500) | **PASS** |
| **Pedagogical Clarity (Ages 13-18)** | ≥ 98.0% | **100.0%** (500/500) | **PASS** |
| **Code Isolation** | 100.0% | **100.0%** (500/500) | **PASS** |
| **Sentence Cap (≤ 3 sentences)** | 100.0% | **100.0%** (500/500) | **PASS** |
| **Untested `error_type` Prompt Probe** | 100.0% Valid JSON | **8/8 Passed** (0% hallucination) | **PASS** |

### Artifacts

- Evaluation Harness: [`scripts/ml/evaluate_model.py`](file:///c:/Projects/code-undercover/scripts/ml/evaluate_model.py)
- Unit Test Suite (11 tests): [`scripts/ml/test_evaluate_model.py`](file:///c:/Projects/code-undercover/scripts/ml/test_evaluate_model.py)
- Detailed Evaluation Report: [`scripts/ml/evaluation_report.md`](file:///c:/Projects/code-undercover/scripts/ml/evaluation_report.md)
- Per-sample Results Data: `scripts/ml/outputs/evaluation_results.json`

