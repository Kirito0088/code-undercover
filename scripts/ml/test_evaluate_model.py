#!/usr/bin/env python3
"""
Unit tests for scripts/ml/evaluate_model.py (T9 Evaluation Harness).

Tests:
  1. JSON Schema validation (strict adherence, rejection of bad types / missing keys / fences).
  2. Sentence count cap (<= 3 sentences per ADR-004).
  3. Pedagogical clarity & jargon detection (prohibits compiler jargon, allows friendly tone).
  4. Code solution isolation check (prohibits multi-line code solutions in explanation).
  5. Mock model runner & end-to-end evaluation report generation.
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest

from evaluate_model import (
    FORBIDDEN_JARGON,
    PlatypusJudge,
    calculate_flesch_reading_ease,
    check_code_in_explanation,
    count_sentences,
    find_jargon,
    generate_markdown_report,
    run_evaluation,
)
from prompt_format import IM_END


# ── 1. Schema Validation ───────────────────────────────────────────────────

def test_judge_accepts_clean_json_output():
    judge = PlatypusJudge()
    raw = '{"explanation": "You forgot the semicolon on this line. C needs one after each statement.", "direct_fix": "int total = a + b;"}'
    (schema_valid, parsed, schema_error, s_count, s_valid, clarity_valid, jargon, reading, code_ok, _) = judge.evaluate_response(raw)
    assert schema_valid is True
    assert schema_error is None
    assert parsed["explanation"] == "You forgot the semicolon on this line. C needs one after each statement."
    assert parsed["direct_fix"] == "int total = a + b;"
    assert s_count == 2
    assert s_valid is True
    assert clarity_valid is True
    assert code_ok is True


def test_judge_tolerates_trailing_im_end():
    judge = PlatypusJudge()
    raw = '{"explanation": "Missing semicolon.", "direct_fix": "int x = 1;"}<|im_end|>\n'
    (schema_valid, parsed, schema_error, _, _, _, _, _, _, _) = judge.evaluate_response(raw)
    assert schema_valid is True
    assert parsed["direct_fix"] == "int x = 1;"


def test_judge_rejects_markdown_code_fences():
    judge = PlatypusJudge()
    raw = '```json\n{"explanation": "Missing semicolon.", "direct_fix": "int x = 1;"}\n```'
    (schema_valid, _, schema_error, _, _, _, _, _, _, _) = judge.evaluate_response(raw)
    assert schema_valid is False
    assert "not valid JSON" in schema_error or "expected" in schema_error


def test_judge_rejects_missing_keys():
    judge = PlatypusJudge()
    raw = '{"explanation": "Missing semicolon."}'
    (schema_valid, _, schema_error, _, _, _, _, _, _, _) = judge.evaluate_response(raw)
    assert schema_valid is False
    assert "expected exactly" in schema_error


def test_judge_rejects_extra_keys():
    judge = PlatypusJudge()
    raw = '{"explanation": "Missing semicolon.", "direct_fix": "int x = 1;", "confidence": 0.99}'
    (schema_valid, _, schema_error, _, _, _, _, _, _, _) = judge.evaluate_response(raw)
    assert schema_valid is False
    assert "expected exactly" in schema_error


# ── 2. Sentence Count & ADR-004 Cap ────────────────────────────────────────

def test_count_sentences_standard():
    assert count_sentences("One sentence.") == 1
    assert count_sentences("Sentence one. Sentence two! Sentence three?") == 3
    assert count_sentences("Sentence one. Sentence two! Sentence three. Sentence four.") == 4


def test_judge_rejects_explanation_exceeding_3_sentences():
    judge = PlatypusJudge()
    long_expl = "Sentence one. Sentence two. Sentence three. Sentence four."
    raw = json.dumps({"explanation": long_expl, "direct_fix": "x = 1;"})
    (schema_valid, _, schema_error, s_count, s_valid, _, _, _, _, _) = judge.evaluate_response(raw)
    assert s_count == 4
    assert s_valid is False
    assert schema_valid is False
    assert "exceeded 3 sentences" in schema_error


# ── 3. Jargon & Pedagogical Clarity ────────────────────────────────────────

def test_jargon_detection():
    clean = "The compiler could not find the closing brace for this function. Check where your loop ends."
    assert find_jargon(clean) == []
    
    dirty = "This expression is not an lvalue because you attempted to dereference a null pointer during lexical parsing."
    found = find_jargon(dirty)
    assert "lvalue" in found
    assert "dereference" in found
    assert "lexical" in found
    assert "parsing" in found


def test_reading_ease_calculation():
    easy = "You forgot the semicolon at the end of the line. Add a semicolon and try again."
    score = calculate_flesch_reading_ease(easy)
    assert score > 60.0


# ── 4. Code Solution Isolation ─────────────────────────────────────────────

def test_code_in_explanation_checks():
    clean_expl = "Look at the line above and make sure you add a semicolon `;` before `return`."
    ok, reason = check_code_in_explanation(clean_expl)
    assert ok is True
    assert reason is None
    
    multiline_code = "You need to change the function to:\nint checkGrade() {\n    return 1;\n}"
    ok, reason = check_code_in_explanation(multiline_code)
    assert ok is False
    assert "function definition" in reason or "multi-line" in reason

    fenced_code = "Use this code: ```int x = 5;```"
    ok, reason = check_code_in_explanation(fenced_code)
    assert ok is False
    assert "fence" in reason


# ── 5. Mock Evaluation Pipeline ────────────────────────────────────────────

class MockModelRunner:
    def generate_batch(self, prompts):
        # Returns perfectly compliant outputs for all prompts
        return [
            '{"explanation": "The compiler needs a semicolon at the end of this statement. Add a `;` and compile again.", "direct_fix": "int x = 10;"}' + IM_END
            for _ in prompts
        ]


def test_run_evaluation_mock(tmp_path):
    val_file = tmp_path / "mock_val.jsonl"
    val_file.write_text(
        json.dumps({
            "instruction": "Explain error",
            "gcc_error": "error: expected ';'",
            "broken_line": "int x = 10",
            "explanation": "Missing semicolon",
            "direct_fix": "int x = 10;",
        }) + "\n",
        encoding="utf-8",
    )
    
    runner = MockModelRunner()
    metrics, samples = run_evaluation(val_file, runner, batch_size=2, run_probes=True)
    
    assert metrics.total_samples == 1
    assert metrics.schema_compliance_pct == 100.0
    assert metrics.clarity_compliance_pct == 100.0
    assert metrics.code_isolated_pct == 100.0
    assert metrics.meets_shipping_bar is True
    
    report_file = tmp_path / "report.md"
    report_text = generate_markdown_report(metrics, samples, report_file)
    assert "PASS (READY TO SHIP)" in report_text
    assert report_file.exists()
