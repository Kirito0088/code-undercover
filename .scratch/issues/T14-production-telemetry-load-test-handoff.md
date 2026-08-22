# T14 — Production Telemetry, Load Test & Handoff

GitHub: [#14](../../../issues/14) — `wayfinder:task`

**Blocked by:** T13 (Staging Cutover)
**Blocks:** — (final ticket on this map)

## Question

Ship production telemetry, verify the system survives a classroom-scale traffic spike, and write
the handoff runbook.

## Scope

- API telemetry in `app/api/compiler/explain/route.ts`: cache hit rate, Ollama latency
  (P50/P95), circuit-breaker trip rate, source breakdown (`cache`/`generated`/`fallback`).
- Simulate doc 2's classroom spike scenario: 60 concurrent students submitting code. Traffic
  shape (burst vs. ramp) and which missions' error profiles to replay is flagged as open on the
  map's "Not yet specified" — sharpen it here once T13's E2E fixtures exist to draw from.
- Success bar from doc 2: server stays responsive, **<18% CPU load**, **>75% cache hit rate**.
- `HANDOFF.md` at repo root: architecture summary, the Oracle instance's operational details
  (systemd service name, restart procedure, how to redeploy a new model version), troubleshooting
  procedures for the failure modes ADR-004 already anticipates (timeout, OOM, cold start), and a
  pointer back to this map for the full decision history.

## Definition of done

- [ ] Telemetry live and queryable
- [ ] Load test run, results against the <18% CPU / >75% cache-hit bar recorded
- [ ] `HANDOFF.md` committed, covering operational runbook + troubleshooting
- [ ] This map's "Decisions so far" reflects the full route walked, end to end
