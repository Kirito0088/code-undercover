# T12 — CI/CD & Docker Compose Oracle Wiring

GitHub: [#12](../../../issues/12) — `wayfinder:task`

**Blocked by:** T11 (GGUF Quantization & Oracle Deploy)
**Blocks:** T13 (Staging Cutover)

## Question

Wire the real Oracle endpoint from T11 into CI/CD and deployment config — replacing the dummy
`.env.example` placeholder with a real secret, injected safely.

## Scope

- `.github/workflows/ci.yml` currently has zero Ollama wiring — confirmed this session. Add
  `OLLAMA_BASE_URL` / `OLLAMA_MODEL` as GitHub Actions secrets (repo admin sets the secret
  values; the agent wires the workflow YAML to reference them, never hardcodes the real URL).
- `docker-compose.yml` also has zero Ollama wiring — decide (per the map's "Not yet specified":
  local dev Ollama stub) whether local dev should point at the real Oracle instance, a mock, or
  stay unset with `lib/explainService.ts`'s fallback path covering local dev entirely.
- Confirm zero secrets leak into the repo — grep the diff for the literal endpoint before
  committing.

## Definition of done

- [ ] Real `OLLAMA_BASE_URL` reachable from the deployed app (Vercel env var or GitHub secret,
      per how this repo actually deploys — verify, don't assume Vercel is the target if it isn't
      already configured)
- [ ] CI green with the new wiring
- [ ] Zero secret leak in the repo (verified, not assumed)
