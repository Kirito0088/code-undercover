# Platypus AI Diagnostic Assistant — Ticket Board

Fourteen tracer-bullet vertical slices, tied together by the
[production cutover map](./MAP-platypus-production-cutover.md) (T7–T14). Each ticket is
independently verifiable and leaves the app (or the model/infra track) in a working state.

## Status (GitHub, checked 2026-08-15)

| Ticket | GitHub # | State |
|---|---|---|
| T1 | [#2](../../../issues/2) | ✅ Closed |
| T2 | [#3](../../../issues/3) | ✅ Closed |
| T3 | [#16](../../../issues/16) | ✅ Closed |
| T4 | [#15](../../../issues/15) | ✅ Closed |
| T5 | [#4](../../../issues/4) | 🔵 Open |
| T6 | [#5](../../../issues/5) | 🔵 Open |
| Map | [#6](../../../issues/6) | 🔵 Open |
| T7 | [#7](../../../issues/7) | 🔵 Open |
| T8 | [#8](../../../issues/8) | 🔵 Open |
| T9 | [#9](../../../issues/9) | 🔵 Open |
| T10 | [#10](../../../issues/10) | 🔵 Open (HITL — blocked on human Oracle Cloud signup) |
| T11 | [#11](../../../issues/11) | 🔵 Open |
| T12 | [#12](../../../issues/12) | 🔵 Open |
| T13 | [#13](../../../issues/13) | 🔵 Open |
| T14 | [#14](../../../issues/14) | 🔵 Open |

Note: T3/T4 were re-filed under #16/#15 after their original #2/#3-adjacent numbers; the closed
issues above are the current canonical ones.

## Dependency DAG

```
T1 (Persistence)  ──┐
                    ├──> T3 (API + Circuit Breaker) ──┐
T2 (AST Extraction) ┤                                 ├──> T5 (State Machine) ──> T6 (Premium Gating) ──┐
                    └──> T4 (Monaco Markers) ─────────┘                                                  │
                                                                                                           ▼
T7 (Dataset) ──> T8 (Fine-tune) ──> T9 (Judge Eval) ──┐                                          T13 (Staging Cutover)
                                                        ├──> T11 (Quantize+Deploy) ──> T12 (CI/CD) ──┘         │
                                       T10 (Oracle HITL)┘                                                       ▼
                                                                                              T14 (Telemetry+Load+Handoff)
```

| Ticket | Title | Blocked by | Blocks |
|---|---|---|---|
| [T1](./T1-persistence-layer.md) | Persistence Layer — `CompilerErrorCache` + hasher | — | T3 |
| [T2](./T2-gcc-ast-extraction.md) | Deterministic GCC AST Extraction | — | T3, T4 |
| [T3](./T3-oracle-api-circuit-breaker.md) | Oracle Server API & Circuit Breaker | T1, T2 | T5 |
| [T4](./T4-monaco-markers-decals.md) | Monaco Editor Markers & Gutter Decals | T2 | T5 |
| [T5](./T5-platypus-state-machine.md) | Platypus Interactive State Machine | T3, T4 | T6 |
| [T6](./T6-premium-routing-auth-gating.md) | Premium Routing & Auth Gating | T5 | T13 |
| [Map](./MAP-platypus-production-cutover.md) | Production Cutover Map (charts T7–T14) | — | — |
| [T7](./T7-synthetic-dataset-generation.md) | Synthetic Dataset Generation (5,000 JSONL) | — | T8 |
| [T8](./T8-unsloth-qlora-finetuning.md) | Unsloth QLoRA Fine-Tuning | T7 | T9 |
| [T9](./T9-llm-as-judge-evaluation.md) | LLM-as-Judge Evaluation | T8 | T11 |
| [T10](./T10-oracle-cloud-provisioning.md) | Oracle Cloud Account & Instance (HITL) | — | T11 |
| [T11](./T11-gguf-quantization-oracle-deploy.md) | GGUF Quantization & Oracle Deploy | T9, T10 | T12 |
| [T12](./T12-cicd-docker-compose-wiring.md) | CI/CD & Docker Compose Wiring | T11 | T13 |
| [T13](./T13-staging-cutover.md) | Staging Cutover: Migration & E2E Suite | T5, T6, T12 | T14 |
| [T14](./T14-production-telemetry-load-test-handoff.md) | Production Telemetry, Load Test & Handoff | T13 | — |

**Parallelizable:** T1 ∥ T2 at the start; T3 ∥ T4 once T2 lands. T5/T6 (app) ∥ T7 (dataset) ∥ T10
(Oracle HITL) can all run concurrently — none of the three tracks blocks another until T13.

## Pre-existing code this feature touches

| File | Current state | Impact |
|---|---|---|
| `lib/compiler.ts` | Parses GCC via **regex over stderr** (`parseGccDiagnostics`) | T2 replaces this with JSON parsing |
| `lib/compilerExplanation.ts` | **Static rule-based** explanation map, already wired at `compiler.ts:226` | See [OPEN-1](#open-questions) — conflicts with AI explanations |
| `lib/errorClassifier.ts` | 21 `CompilerErrorType` variants | Retained; useful for prompt context and fallback selection |
| `types/index.ts` | `CompilerDiagnostic` has no `children` | T2 extends it |
| `prisma/schema.prisma` | `User` has **no premium field** | T6 adds one |
| `lib/rate-limit.ts` | Upstash Redis, exists but unused on this path | See [OPEN-2](#open-questions) |

## Open questions

<a name="open-questions"></a>

**OPEN-1 — Static vs. AI explanations.** `lib/compilerExplanation.ts` already delivers
beginner-friendly explanations deterministically, at zero compute cost, for 21 known error
types. The Platypus AI assistant overlaps this substantially. Three options, unresolved:
- (a) AI supersedes it — delete the static map.
- (b) Static map serves as the Fallback Explanation instead of the generic ADR-004 string
  (better UX, and free).
- (c) Static map handles known types; AI handles `unknown` only (cheapest, best cache
  characteristics).

**Recommendation: (c), with (b) as the failure path.** This dramatically reduces Oracle
load — most student errors are the 20 common ones already covered. Blocks nothing, but
should be decided before T3 is implemented.

**OPEN-2 — Abuse / compute exhaustion.** Nothing prevents spam-compiling trivial variations
of a broken line to force repeated cache misses and exhaust the Oracle free tier.
`lib/rate-limit.ts` exists but is not applied to `/api/compiler/explain`. Not scoped into
any ticket. Should be a T7.
