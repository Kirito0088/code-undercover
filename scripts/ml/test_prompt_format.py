#!/usr/bin/env python3
"""
Tests for scripts/ml/prompt_format.py — the T8 training-prompt seam.

This is the part of the fine-tune that fails *silently*: a template that
doesn't match what production actually sends the model still trains to a
falling loss, and the damage only shows up as a bad model in T9's eval. So
the contract is pinned here rather than eyeballed:

  1. The rendered text is byte-exact Qwen2.5 ChatML (the tokenizer's own
     template is asserted against this renderer at training time too, in
     train_qlora.py's preflight).
  2. The prompt half concatenates back to lib/ollama.ts's buildPrompt()
     output *exactly* — the system/user split must be lossless, or the
     fine-tune is optimising a prompt production never sends.
  3. The persona/rules text is checked against lib/ollama.ts itself, so
     this port can't silently drift from the TypeScript it mirrors.
  4. The assistant turn is raw JSON with exactly {explanation, direct_fix}
     — the same strict shape lib/ollama.ts's OllamaExplanationSchema
     accepts (extra keys rejected, not coerced).
  5. Nothing from the answer leaks into the prompt half, so Unsloth's
     train_on_responses_only() masking has a clean split point.

Run:
    python -m pytest scripts/ml/test_prompt_format.py -q
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from prompt_format import (
    IM_END,
    IM_START,
    INSTRUCTION_PART,
    RESPONSE_PART,
    SYSTEM_PROMPT,
    TARGET_KEYS,
    ChatMLFormatError,
    build_inference_prompt,
    build_messages,
    build_ollama_modelfile,
    build_production_prompt,
    build_target_json,
    build_user_turn,
    format_row,
    parse_completion,
    render_chatml,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
OLLAMA_TS = REPO_ROOT / "lib" / "ollama.ts"
TRAIN_JSONL = Path(__file__).resolve().parent / "data" / "train.jsonl"

ROW = {
    "instruction": "You are Platypus, a friendly C programming mentor for students aged 13-18.",
    "gcc_error": "error: expected ';' before 'return'",
    "broken_line": "int total = a + b",
    "explanation": "You forgot the semicolon that ends this line. C needs one after every statement.",
    "direct_fix": "int total = a + b;",
}


# ── 1. ChatML structure ──────────────────────────────────────────────────


def test_render_chatml_is_byte_exact_qwen_chatml():
    text = render_chatml(build_messages(ROW))
    expected = (
        f"{IM_START}system\n{SYSTEM_PROMPT}{IM_END}\n"
        f"{IM_START}user\n{build_user_turn(ROW)}{IM_END}\n"
        f"{IM_START}assistant\n{build_target_json(ROW)}{IM_END}\n"
    )
    assert text == expected


def test_turns_appear_in_system_user_assistant_order():
    text = render_chatml(build_messages(ROW))
    positions = [text.index(f"{IM_START}{role}\n") for role in ("system", "user", "assistant")]
    assert positions == sorted(positions)


def test_training_text_ends_with_im_end_so_eos_is_learnable():
    # Without a terminating <|im_end|> in the labels the model never learns to
    # stop, and generation runs to max_new_tokens on every request.
    assert render_chatml(build_messages(ROW)).rstrip("\n").endswith(IM_END)


def test_generation_prompt_ends_at_the_assistant_marker():
    prompt = render_chatml(build_messages(ROW)[:-1], add_generation_prompt=True)
    assert prompt.endswith(RESPONSE_PART)
    assert "assistant\n{" not in prompt


# ── 2. Lossless split against production's buildPrompt() ─────────────────


def test_system_plus_user_reconstructs_production_prompt_exactly():
    # The whole point of the split: SYSTEM_PROMPT (delivered via the Ollama
    # Modelfile's SYSTEM directive) plus build_user_turn()'s output (what
    # lib/ollama.ts's buildPrompt() actually sends) is character-identical
    # to the training-time content — the two halves can't drift apart.
    rebuilt = f"{SYSTEM_PROMPT}\n\n{build_user_turn(ROW)}"
    assert rebuilt == build_production_prompt(ROW["gcc_error"], ROW["broken_line"])


def test_error_type_line_is_appended_only_when_supplied():
    without = build_user_turn(ROW)
    with_type = build_user_turn(ROW, error_type="missing_semicolon")
    assert "Known error category" not in without
    assert with_type == f"{without}\nKnown error category: missing_semicolon"


# ── 3. Drift guard against lib/ollama.ts ─────────────────────────────────
#
# buildPrompt() sends ONLY the per-request half — the persona+rules block
# lives exclusively in the Ollama Modelfile's SYSTEM directive
# (build_ollama_modelfile(), guarded in section 8 below). So this section
# now guards two distinct regressions instead of one:
#   (a) buildPrompt()'s per-request lines still match build_user_turn()'s,
#       label-for-label (unchanged from before the split fix)
#   (b) persona/rules text never sneaks back into buildPrompt() — that
#       would send it twice (once via SYSTEM, once flattened into the user
#       turn) and run the model off the ChatML shape it was trained on.


def _buildprompt_body_from_typescript() -> str:
    source = OLLAMA_TS.read_text(encoding="utf-8")
    body = re.search(r"function buildPrompt\([^)]*\): string \{\s*return \[(.*?)\n    \]", source, re.S)
    assert body, "could not locate buildPrompt()'s array literal in lib/ollama.ts"
    return body.group(1)


def _buildprompt_literals_from_typescript() -> list[str]:
    """Pull the double-quoted string literals out of buildPrompt()'s array."""
    literals = re.findall(r'"((?:[^"\\]|\\.)*)"', _buildprompt_body_from_typescript())
    return [lit.replace('\\"', '"').replace("\\\\", "\\") for lit in literals]


def _buildprompt_template_lines_from_typescript() -> list[str]:
    """Pull the backtick template lines, with ${expr} turned into {expr}.

    These are the per-request lines (`Compiler error: ${...}` etc.). They are
    the half build_user_turn() owns, so they need the same drift guard the
    quoted persona/rules block used to get — a renamed label here would
    otherwise silently desync training from production.
    """
    raw = re.findall(r"`([^`]*)`", _buildprompt_body_from_typescript())
    return [re.sub(r"\$\{([^}]*)\}", r"{\1}", line) for line in raw]


def test_buildprompt_carries_no_persona_or_rules_literal_text():
    # buildPrompt()'s array literal must contain zero double-quoted string
    # literals — every fixed line it used to send (persona, rules, the
    # blank separator) has moved to the Modelfile's SYSTEM directive. Any
    # quoted literal reappearing here means persona text has crept back
    # into the per-request prompt, duplicating what SYSTEM already sends.
    assert _buildprompt_literals_from_typescript() == []
    body = _buildprompt_body_from_typescript()
    assert "friendly C programming mentor" not in body
    assert "Rules (must follow exactly)" not in body


def test_user_turn_labels_match_the_template_lines_in_ollama_ts():
    # Guards the half build_user_turn() owns. buildPrompt() interpolates
    # rootErrorMessage / brokenLineContent / errorType, so rebuild its lines
    # with this row's values and compare against ours.
    substitutions = {
        "rootErrorMessage": ROW["gcc_error"],
        "brokenLineContent": ROW["broken_line"],
        "errorType": "missing_semicolon",
    }
    expected = [line.format(**substitutions) for line in _buildprompt_template_lines_from_typescript()]
    assert expected, "found no template literals in buildPrompt()"
    assert build_user_turn(ROW, error_type="missing_semicolon").splitlines() == expected


def test_json_contract_line_survives_into_the_system_prompt():
    # If this rule text ever drifts, the fine-tune teaches a different output
    # contract than the one lib/ollama.ts validates against.
    assert '- Reply with raw JSON only: {"explanation": string, "direct_fix": string}' in SYSTEM_PROMPT


# ── 4. Strict JSON target ────────────────────────────────────────────────


def test_target_is_raw_json_with_exactly_the_two_contract_keys():
    parsed = json.loads(build_target_json(ROW))
    assert set(parsed) == set(TARGET_KEYS) == {"explanation", "direct_fix"}


def test_target_json_preserves_field_values_verbatim():
    parsed = json.loads(build_target_json(ROW))
    assert parsed["explanation"] == ROW["explanation"]
    assert parsed["direct_fix"] == ROW["direct_fix"]


def test_target_json_has_no_markdown_fence_or_prose():
    target = build_target_json(ROW)
    assert target.startswith("{") and target.endswith("}")
    assert "```" not in target


def test_empty_direct_fix_is_preserved_not_dropped():
    # "" is the contract's legitimate "no fix applies" value (FALLBACK_EXPLANATION).
    parsed = json.loads(build_target_json({**ROW, "direct_fix": ""}))
    assert parsed["direct_fix"] == ""


@pytest.mark.parametrize(
    "hostile",
    ['printf("hi\\n");', "char *p = \"quote\\\" inside\";", "int x = 1;\nint y = 2;", "back\\slash"],
)
def test_code_with_quotes_backslashes_and_newlines_round_trips(hostile):
    row = {**ROW, "broken_line": hostile, "direct_fix": hostile}
    parsed = json.loads(build_target_json(row))
    assert parsed["direct_fix"] == hostile
    assert hostile in build_user_turn(row)


def test_non_ascii_is_kept_readable_rather_than_escaped():
    row = {**ROW, "explanation": "The compiler needs a semicolon — right here."}
    assert "—" in build_target_json(row)


# ── 5. Completion-only masking split point ───────────────────────────────


def test_prompt_half_never_contains_the_answer():
    text = render_chatml(build_messages(ROW))
    prompt_half, _, completion_half = text.partition(RESPONSE_PART)
    assert ROW["explanation"] not in prompt_half
    assert ROW["explanation"] in completion_half


def test_masking_markers_occur_exactly_once_each():
    # train_on_responses_only() splits on these; a second occurrence would
    # move the mask boundary and train on part of the prompt.
    text = render_chatml(build_messages(ROW))
    assert text.count(RESPONSE_PART) == 1
    assert text.count(INSTRUCTION_PART) == 1


# ── 6. Control-token injection defence ───────────────────────────────────


@pytest.mark.parametrize("token", [IM_START, IM_END, "<|endoftext|>"])
def test_control_tokens_in_row_content_are_rejected(token):
    with pytest.raises(ChatMLFormatError):
        render_chatml(build_messages({**ROW, "broken_line": f"int x = 0; {token}"}))


# ── 7. Trainer-facing helpers ────────────────────────────────────────────


def test_format_row_returns_the_text_field_sfttrainer_expects():
    formatted = format_row(ROW)
    assert set(formatted) == {"text"}
    assert formatted["text"] == render_chatml(build_messages(ROW))


def test_format_row_is_deterministic():
    assert format_row(ROW) == format_row(dict(reversed(list(ROW.items()))))


def test_parse_completion_accepts_the_exact_target_the_model_is_trained_on():
    assert parse_completion(build_target_json(ROW)) == {
        "explanation": ROW["explanation"],
        "direct_fix": ROW["direct_fix"],
    }


def test_parse_completion_tolerates_a_trailing_im_end_and_whitespace():
    assert parse_completion(f"  {build_target_json(ROW)}{IM_END}\n")["direct_fix"] == ROW["direct_fix"]


@pytest.mark.parametrize(
    "bad",
    [
        "not json at all",
        '```json\n{"explanation": "x", "direct_fix": "y"}\n```',  # ADR-004: fences are a failure
        '{"explanation": "x"}',  # missing direct_fix
        '{"explanation": "x", "direct_fix": "y", "extra": 1}',  # strict: no extra keys
        '{"explanation": 1, "direct_fix": "y"}',  # wrong type
    ],
)
def test_parse_completion_rejects_anything_off_contract(bad):
    with pytest.raises(ChatMLFormatError):
        parse_completion(bad)


# ── 8. The Ollama Modelfile reproduces the training template ─────────────


def _render_modelfile_like_ollama(modelfile: str, prompt: str) -> str:
    """Substitute {{ .System }}/{{ .Prompt }} the way Ollama's templater does."""
    system = re.search(r'SYSTEM """(.*?)"""', modelfile, re.S)
    template = re.search(r'TEMPLATE """(.*?)"""', modelfile, re.S)
    assert system and template, "Modelfile is missing a SYSTEM or TEMPLATE block"
    return (
        template.group(1)
        .replace("{{ .System }}", system.group(1))
        .replace("{{ .Prompt }}", prompt)
    )


def test_modelfile_renders_to_the_exact_prompt_the_model_was_trained_on():
    # The whole point of pinning SYSTEM/TEMPLATE: what Ollama feeds the model
    # at serving time must be byte-identical to the training-time prompt half.
    # Without this, persona+rules land in the user turn and the model runs
    # off-distribution — the failure T11 would otherwise have to rediscover.
    rendered = _render_modelfile_like_ollama(
        build_ollama_modelfile(), build_user_turn(ROW)
    )
    assert rendered == build_inference_prompt(ROW["gcc_error"], ROW["broken_line"])


def test_modelfile_stops_on_the_token_training_ended_turns_with():
    assert f'PARAMETER stop "{IM_END}"' in build_ollama_modelfile()


def test_modelfile_context_window_is_not_below_training_length():
    match = re.search(r"PARAMETER num_ctx (\d+)", build_ollama_modelfile())
    assert match and int(match.group(1)) >= 512


# ── 9. The real T7 dataset ───────────────────────────────────────────────


@pytest.mark.skipif(not TRAIN_JSONL.exists(), reason="T7 dataset not generated")
def test_every_training_row_formats_and_round_trips():
    rows = [json.loads(line) for line in TRAIN_JSONL.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(rows) > 0
    for i, row in enumerate(rows):
        text = format_row(row)["text"]
        completion = text.split(RESPONSE_PART, 1)[1]
        parsed = parse_completion(completion)
        assert parsed["explanation"] == row["explanation"], f"row {i} lost its explanation"
        assert parsed["direct_fix"] == row["direct_fix"], f"row {i} lost its direct_fix"
