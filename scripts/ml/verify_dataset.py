#!/usr/bin/env python3
"""
Fast verification for the T7 synthetic dataset (train/val JSONL files).

Checks, per row:
  1. The line parses as valid JSON.
  2. The parsed object has *exactly* the 5 required keys — no more, no less —
     matching T3's live API contract: instruction, gcc_error, broken_line,
     explanation, direct_fix.
  3. `explanation` does not exceed 3 sentences (mirrors the sentence-counting
     logic in lib/ollama.ts's countSentences, so a row that would fail the
     production SLM's own schema gate fails here too).

Also checks (not in the ticket's minimal 3, but cheap and worth catching
early): every required value is a string, and all fields except `direct_fix`
are non-empty (an empty direct_fix is valid — it mirrors the "no fix
applies" case in the production contract).

Usage:
    python scripts/ml/verify_dataset.py
    python scripts/ml/verify_dataset.py path/to/one.jsonl path/to/two.jsonl

Exits 0 and prints a summary on success. Exits 1 with the first offending
rows described (path, line number, reason) on any failure — including a
missing file, which is the expected Red state before generate_dataset.py
has produced anything.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REQUIRED_KEYS = {"instruction", "gcc_error", "broken_line", "explanation", "direct_fix"}
MAX_EXPLANATION_SENTENCES = 3
# direct_fix is allowed to be "" (mirrors ExplainResult.directFix / the
# production "no fix applies" case); every other field must be non-empty.
FIELDS_REQUIRING_CONTENT = REQUIRED_KEYS - {"direct_fix"}

DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_FILES = [DEFAULT_DATA_DIR / "train.jsonl", DEFAULT_DATA_DIR / "val.jsonl"]


def count_sentences(text: str) -> int:
    """Port of lib/ollama.ts's countSentences — keep these two in sync."""
    trimmed = text.strip()
    if not trimmed:
        return 0
    matches = re.findall(r"[^.!?]+[.!?]+", trimmed)
    if not matches:
        return 1
    consumed = sum(len(m) for m in matches)
    return len(matches) + (1 if consumed < len(trimmed) else 0)


class Violation(Exception):
    def __init__(self, path: Path, line_no: int, reason: str):
        super().__init__(f"{path}:{line_no}: {reason}")
        self.path = path
        self.line_no = line_no
        self.reason = reason


def verify_file(path: Path, violations: list[Violation]) -> int:
    """Returns the number of rows checked in this file (0 if unreadable)."""
    if not path.exists():
        violations.append(Violation(path, 0, "file does not exist"))
        return 0

    row_count = 0
    with path.open("r", encoding="utf-8") as f:
        for line_no, raw_line in enumerate(f, start=1):
            line = raw_line.rstrip("\n")
            if not line.strip():
                continue  # tolerate trailing blank lines

            row_count += 1

            # Check 1: valid JSON.
            try:
                row = json.loads(line)
            except json.JSONDecodeError as e:
                violations.append(Violation(path, line_no, f"invalid JSON ({e})"))
                continue

            if not isinstance(row, dict):
                violations.append(Violation(path, line_no, f"row is not a JSON object (got {type(row).__name__})"))
                continue

            # Check 2: exactly the 5 required keys.
            actual_keys = set(row.keys())
            if actual_keys != REQUIRED_KEYS:
                missing = REQUIRED_KEYS - actual_keys
                extra = actual_keys - REQUIRED_KEYS
                parts = []
                if missing:
                    parts.append(f"missing {sorted(missing)}")
                if extra:
                    parts.append(f"unexpected {sorted(extra)}")
                violations.append(Violation(path, line_no, f"key set mismatch: {'; '.join(parts)}"))
                continue

            # Field types + non-emptiness.
            bad_field = False
            for key in REQUIRED_KEYS:
                value = row[key]
                if not isinstance(value, str):
                    violations.append(Violation(path, line_no, f"'{key}' is not a string (got {type(value).__name__})"))
                    bad_field = True
                elif key in FIELDS_REQUIRING_CONTENT and value.strip() == "":
                    violations.append(Violation(path, line_no, f"'{key}' is empty"))
                    bad_field = True
            if bad_field:
                continue

            # Check 3: explanation sentence cap.
            sentence_count = count_sentences(row["explanation"])
            if sentence_count > MAX_EXPLANATION_SENTENCES:
                violations.append(
                    Violation(
                        path,
                        line_no,
                        f"'explanation' has {sentence_count} sentences (max {MAX_EXPLANATION_SENTENCES}): "
                        f"{row['explanation']!r}",
                    )
                )

    return row_count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "files",
        nargs="*",
        type=Path,
        help=f"JSONL files to verify (default: {', '.join(str(p) for p in DEFAULT_FILES)})",
    )
    parser.add_argument(
        "--max-report",
        type=int,
        default=20,
        help="max number of violations to print before truncating (default: 20)",
    )
    args = parser.parse_args()

    files = args.files or DEFAULT_FILES

    violations: list[Violation] = []
    total_rows = 0
    for path in files:
        total_rows += verify_file(path, violations)

    if violations:
        print(f"FAIL — {len(violations)} violation(s) across {len(files)} file(s):\n", file=sys.stderr)
        for v in violations[: args.max_report]:
            print(f"  {v}", file=sys.stderr)
        if len(violations) > args.max_report:
            print(f"  ... and {len(violations) - args.max_report} more", file=sys.stderr)
        return 1

    print(f"PASS — {total_rows} row(s) across {len(files)} file(s) verified:")
    for path in files:
        print(f"  {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
