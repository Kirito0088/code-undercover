# T10 — Oracle Cloud Account & Instance Provisioning

GitHub: [#10](../../../issues/10) — `wayfinder:task`

**Blocked by:** — (independent of the fine-tuning track; runs in parallel per the effort's own
sequencing decision)
**Blocks:** T11 (GGUF Quantization & Oracle Deploy)

**Type: HITL Task.** No Oracle Cloud account exists yet (no `~/.oci` config anywhere reachable
from this machine), and OCI account signup + identity verification is inherently something only
the human can do — the agent cannot self-serve a cloud account.

## Checklist for the human

- [ ] Sign up for an Oracle Cloud Always Free tier account (identity verification required)
- [ ] Create an ARM-based Ampere A1 Compute instance: up to 4 OCPUs, 24GB RAM, Ubuntu 24.04
- [ ] Configure VCN + security list / firewall rules to allow inbound traffic on Ollama's port
      (11434) from the Vercel deployment's egress, or from wherever `OLLAMA_BASE_URL` will be
      called from — **not** open to the public internet
- [ ] Generate and share SSH access (or hand credentials to the agent via a secrets manager, not
      pasted in chat/issue text) so a follow-up ticket can install Ollama + deploy the model
- [ ] Record the instance's public endpoint here on resolution — T11 and T12 need it

## What the agent can do once access exists

Once SSH access is available, the agent can write and run the actual provisioning script (the
`wizard` skill, per doc 2's TASK-5.1) — installing Ollama, configuring it as a systemd service,
and setting firewall rules via the OCI CLI. That work belongs in T11, not here; this ticket is
scoped strictly to the account + instance existing.

## Definition of done

- [ ] Oracle Cloud Always Free account active
- [ ] ARM Ampere A1 instance running, reachable via SSH
- [ ] Endpoint/access details recorded in the resolution comment (not the model weights or
      secrets themselves — pointers only)
