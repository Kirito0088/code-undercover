#!/usr/bin/env python3
"""
T8 training-prompt formatting — the single source of truth for how a T7
dataset row becomes a Qwen2.5 ChatML training example.

Why this is its own module (and not inlined in train_qlora.py): a wrong
prompt template is the failure mode that *still trains*. Loss falls, the run
looks healthy, and the damage only surfaces as a bad model in T9's eval. So
the format is pinned by test_prompt_format.py instead of eyeballed, and
train_qlora.py additionally asserts this renderer byte-matches the real
tokenizer's chat template before it starts.

Train/serve alignment
---------------------
Production does *not* send an invented prompt: `lib/ollama.ts`'s
buildPrompt() sends a fixed persona + rules block, then the error and the
offending line. This module splits exactly that string into a ChatML system
turn (persona + rules) and a user turn (error + line), so that

    SYSTEM_PROMPT + "\\n\\n" + build_user_turn(row) == buildPrompt(...)

holds character-for-character (asserted in the tests). The split — rather
than one flat user turn — is what lets T11's Ollama Modelfile pin the
persona as a real SYSTEM directive while the per-request half stays the
user turn.

Keep SYSTEM_PROMPT in sync with lib/ollama.ts's buildPrompt(); the test
suite parses that TypeScript and fails if the two ever drift.

The assistant turn is raw JSON with exactly `{explanation, direct_fix}` —
the same strict shape `OllamaExplanationSchema` validates in production
(extra keys rejected outright, per ADR-004).
"""
from __future__ import annotations

import json
from typing import Any, Iterable, Mapping

# ── Qwen2.5 ChatML control tokens ────────────────────────────────────────
IM_START = "<|im_start|>"
IM_END = "<|im_end|>"

# Split points handed to Unsloth's train_on_responses_only(): everything from
# RESPONSE_PART onward is what the loss is computed over.
INSTRUCTION_PART = f"{IM_START}user\n"
RESPONSE_PART = f"{IM_START}assistant\n"

# Rejected anywhere in row content — a row carrying one of these would move
# the masking boundary and silently train on the wrong span.
FORBIDDEN_TOKENS = (IM_START, IM_END, "<|endoftext|>")

# The persona + rules half of lib/ollama.ts's buildPrompt(). Verbatim: the
# drift guard in test_prompt_format.py parses the TypeScript and compares.
SYSTEM_PROMPT = "\n".join(
    [
        "You are Platypus, a friendly C programming mentor for students aged 13-18.",
        "A student's code failed to compile. Explain the mistake and suggest a fix.",
        "",
        "Rules (must follow exactly):",
        '- Reply with raw JSON only: {"explanation": string, "direct_fix": string}',
        "- No markdown, no code fences, no prose outside the JSON object.",
        "- explanation must be at most 3 sentences, plain English, no jargon.",
        '- direct_fix is a short, concrete code suggestion (or "" if none applies).',
    ]
)

# The two keys of T3's live API contract, in contract order.
TARGET_KEYS = ("explanation", "direct_fix")


class ChatMLFormatError(ValueError):
    """A row (or a model completion) violates the training-prompt contract."""


def build_production_prompt(
    root_error_message: str,
    broken_line_content: str,
    error_type: str | None = None,
) -> str:
    """Port of lib/ollama.ts's buildPrompt() — the exact string production sends.

    Composed from the same two halves the ChatML turns use, so the split can
    never drift from the flat string: the persona+rules block, a blank line,
    then the per-request lines.
    """
    row = {"gcc_error": root_error_message, "broken_line": broken_line_content}
    return f"{SYSTEM_PROMPT}\n\n{build_user_turn(row, error_type=error_type)}"


def build_user_turn(row: Mapping[str, Any], error_type: str | None = None) -> str:
    """The per-request half of the production prompt: the error and the line.

    `error_type` is left off by default because that is how production calls
    it — explainService.ts only reaches the SLM once classifyCompilerError()
    has already returned "unknown", and it forwards its own optional
    `errorType` argument, which is normally absent.
    """
    lines = [
        f"Compiler error: {row['gcc_error']}",
        f"Offending line: {row['broken_line']}",
    ]
    if error_type is not None:
        lines.append(f"Known error category: {error_type}")
    return "\n".join(lines)


def build_target_json(row: Mapping[str, Any]) -> str:
    """The assistant turn: raw JSON, contract key order, no fences, no prose.

    ensure_ascii=False keeps em-dashes and the like as themselves rather than
    \\uXXXX escapes — fewer tokens, and it matches what the API returns.
    """
    return json.dumps(
        {"explanation": row["explanation"], "direct_fix": row["direct_fix"]},
        ensure_ascii=False,
    )


def build_messages(row: Mapping[str, Any], error_type: str | None = None) -> list[dict[str, str]]:
    """The full system/user/assistant turn list for one training row."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_turn(row, error_type=error_type)},
        {"role": "assistant", "content": build_target_json(row)},
    ]


def render_chatml(messages: Iterable[Mapping[str, str]], add_generation_prompt: bool = False) -> str:
    """Render turns as Qwen2.5 ChatML.

    Byte-identical to the Qwen2.5-Coder-Instruct tokenizer's own chat
    template for plain system/user/assistant turns — train_qlora.py asserts
    that parity against the real tokenizer at startup, so this stays a
    mirror rather than a second opinion.
    """
    parts = []
    for message in messages:
        content = message["content"]
        for token in FORBIDDEN_TOKENS:
            if token in content:
                raise ChatMLFormatError(
                    f"{message['role']} turn contains the control token {token!r}; "
                    "that would move train_on_responses_only()'s masking boundary"
                )
        parts.append(f"{IM_START}{message['role']}\n{content}{IM_END}\n")
    if add_generation_prompt:
        parts.append(RESPONSE_PART)
    return "".join(parts)


def format_row(row: Mapping[str, Any], error_type: str | None = None) -> dict[str, str]:
    """One dataset row → the `{"text": ...}` field SFTTrainer trains on."""
    return {"text": render_chatml(build_messages(row, error_type=error_type))}


def build_inference_prompt(root_error_message: str, broken_line_content: str) -> str:
    """The prompt half only, ending at the assistant marker — for T9's eval."""
    row = {"gcc_error": root_error_message, "broken_line": broken_line_content}
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_turn(row)},
    ]
    return render_chatml(messages, add_generation_prompt=True)


DEFAULT_GGUF_FILENAME = "qwen2.5-coder-3b-platypus-q4_k_m.gguf"


def build_ollama_modelfile(gguf_filename: str = DEFAULT_GGUF_FILENAME) -> str:
    """The Ollama Modelfile whose rendered output reproduces training ChatML.

    Lives here rather than in merge_and_export.py because it has to stay in
    lockstep with render_chatml() — and because that lets the test suite
    verify the rendered result without importing torch.

    Production posts a single flat `prompt` string to /api/generate, which
    Ollama substitutes into `{{ .Prompt }}`. Pinning SYSTEM and TEMPLATE is
    what keeps the persona+rules in a system turn at serving time, matching
    where training put them; see README.md for the matching change
    lib/ollama.ts needs.
    """
    return f"""# Generated by scripts/ml/merge_and_export.py (T8) — do not hand-edit.
#
# Reproduces the exact ChatML the adapter was fine-tuned on. The SYSTEM
# block below is the persona+rules half of lib/ollama.ts's buildPrompt();
# buildPrompt() must therefore send only its per-request half (the
# "Compiler error:" / "Offending line:" lines) as the prompt.

FROM ./{gguf_filename}

SYSTEM \"\"\"{SYSTEM_PROMPT}\"\"\"

TEMPLATE \"\"\"{IM_START}system
{{{{ .System }}}}{IM_END}
{IM_START}user
{{{{ .Prompt }}}}{IM_END}
{RESPONSE_PART}\"\"\"

PARAMETER stop "{IM_END}"
PARAMETER temperature 0.2
PARAMETER num_ctx 512
"""


def parse_completion(text: str) -> dict[str, str]:
    """Parse a model completion under the same strictness as production.

    Mirrors lib/ollama.ts: raw JSON only, exactly {explanation, direct_fix},
    both strings. Markdown-fenced JSON is a failure, not something to unwrap
    (ADR-004 — a model that can't emit raw JSON isn't trusted on content).
    Only a trailing <|im_end|> and surrounding whitespace are tolerated,
    since those are generation artefacts rather than model prose.
    """
    candidate = text.strip()
    if candidate.endswith(IM_END):
        candidate = candidate[: -len(IM_END)].strip()

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as error:
        raise ChatMLFormatError(f"completion was not valid JSON: {error}") from error

    if not isinstance(parsed, dict):
        raise ChatMLFormatError(f"completion was not a JSON object (got {type(parsed).__name__})")
    if set(parsed) != set(TARGET_KEYS):
        raise ChatMLFormatError(f"expected exactly {list(TARGET_KEYS)}, got {sorted(parsed)}")
    for key in TARGET_KEYS:
        if not isinstance(parsed[key], str):
            raise ChatMLFormatError(f"'{key}' must be a string (got {type(parsed[key]).__name__})")

    return {key: parsed[key] for key in TARGET_KEYS}
