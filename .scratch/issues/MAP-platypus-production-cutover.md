# Platypus AI — Production Cutover Map

GitHub: [#6](../../../issues/6) — `wayfinder:map`

## Destination

Platypus AI running for real in production: the fine-tuned, quantized `qwen2.5-coder-platypus:3b`
model served from a provisioned Oracle Cloud Always Free Ollama instance, wired end-to-end with
the already-built app-side seam (T1–T6: cache, AST parser, circuit-breaker API, Monaco markers,
state machine, premium gating), verified in staging, and monitored in production.

## Notes

- **This map carries execution.** Tickets are tracer-bullet implementation slices in the same
  style as T1–T6 — not abstract decisions to research. Each is sized to one session and records
  its resolution as a decision before closing.
- Domain: `CONTEXT.md`, ADR-001..004 in `docs/adr/`, and the three source docs this map was
  charted from (Architectural Blueprint, Master Development Plan & Roadmap, PRD — supplied by the
  user, not committed to the repo).
- **Schema resolved:** `{ explanation, direct_fix }` + Fixes/Reveal UI (docs 2 & 3, and everything
  already built) is the target. Doc 1's 3-field hint-ladder design is superseded — do not build
  toward it.
- Skills to consult per ticket: `implement`, `tdd`, `wizard` (HITL provisioning), `sql-optimization`
  (staging migration), `code-review`.
- T5 ([#4](../../../issues/4)) and T6 ([#5](../../../issues/5)) are tracked as ordinary issues, not
  children of this map — fully specified before this map existed. This map picks up everything
  beyond them.

## Tickets on this map

| Ticket | Title | Blocked by | Blocks |
|---|---|---|---|
| [T7](./T7-synthetic-dataset-generation.md) | Synthetic Dataset Generation (5,000 JSONL pairs) | — | T8 |
| [T8](./T8-unsloth-qlora-finetuning.md) | Unsloth QLoRA Fine-Tuning (RTX 3050) | T7 | T9 |
| [T9](./T9-llm-as-judge-evaluation.md) | LLM-as-Judge Evaluation Harness | T8 | T11 |
| [T10](./T10-oracle-cloud-provisioning.md) | Oracle Cloud Account & Instance Provisioning (HITL) | — | T11 |
| [T11](./T11-gguf-quantization-oracle-deploy.md) | GGUF Quantization & Oracle Deploy | T9, T10 | T12 |
| [T12](./T12-cicd-docker-compose-wiring.md) | CI/CD & Docker Compose Oracle Wiring | T11 | T13 |
| [T13](./T13-staging-cutover.md) | Staging Cutover: Migration & E2E Suite | T5, ~~T6~~ (deferred), T12 | T14 |
| [T14](./T14-production-telemetry-load-test-handoff.md) | Production Telemetry, Load Test & Handoff | T13 | — |

## Decisions so far

- **T6 (Premium Routing & Auth Gating) deferred, not cancelled.** No ticket on this map depends
  on it except T13's blocked-by list — the T7–T12 fine-tuning/Oracle-deploy track is entirely
  independent of premium gating. Rationale: pre-launch, gating is easy to add later; forcing it
  now blocks nothing else and the whole feature is still behind an unreleased app. **Caveat this
  decision doesn't cover:** `directFix` is unredacted for every caller of
  `/api/compiler/explain` today (T3 built the route to return it plain; redaction was always
  T6's job) — that's fine on a private/dev instance, but T6 must land before any early-access or
  beta user, not just before a full production launch, since deferring it past that point means
  paid content is free for whoever gets in first. T13 picks this back up — see its own note.

  See also: [ADR-002](../docs/adr/0002-global-error-line-hashing.md) (the redaction guarantee
  T6 exists to uphold), [ADR-003](../docs/adr/0003-pedagogical-ui-friction.md) (the Reveal CTA
  T6 was going to wire to premium/upsell branching — doesn't exist yet either, since T5 punted
  CTA construction to T6 by design).

## Not yet specified

- **Local dev Ollama stub.** Whether `docker-compose.yml` should also grow a mocked/local Ollama
  service for dev-loop testing independent of the Oracle instance — revisit once T12 is underway.
- **Load-test traffic shape for T14.** Doc 2 specifies "60 concurrent students" but not request
  pattern (burst vs. ramp) or which missions' error profiles to replay — sharpen once T13's E2E
  fixtures exist.
- **Handoff document scope.** TASK-7.2 says "operational runbooks and troubleshooting procedures"
  without exact contents — graduates into a ticket once T14 nears completion.

## Out of scope

- **Doc 1's 3-field hint-ladder schema** (`hint`/`explanation`/`actionable_fix`, progressive
  reveal) — ruled out by the user in favor of docs 2 & 3's `explanation`/`direct_fix` design,
  which T3/T5/T6 already implement. A scope call made before charting, not a decision on this
  map's route.
