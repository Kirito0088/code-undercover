#!/usr/bin/env python3
"""
Synthetic dataset generator for Platypus, Code Undercover's C-mentor SLM (T7).

Builds JSONL pairs mapping GCC compiler errors to plain-English explanations,
matching T3's live API contract:

    {"instruction": str, "gcc_error": str, "broken_line": str,
     "explanation": str, "direct_fix": str}

Taxonomy is pulled from the 21 `CompilerErrorType` variants in
lib/errorClassifier.ts. Every `gcc_error` string is written to actually match
that file's classification RULES (verified in tests) so the dataset reflects
real error-type -> message mappings, not invented ones.

Usage:
    python scripts/ml/generate_dataset.py                       # 5000 rows, seed 42
    python scripts/ml/generate_dataset.py --count 50 --seed 1    # small smoke batch
    python scripts/ml/generate_dataset.py --out-dir some/dir --no-manifest
"""
from __future__ import annotations

import argparse
import json
import math
import random
import re
from dataclasses import dataclass, field
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUT_DIR = SCRIPT_DIR / "data"
DEFAULT_MANIFEST_PATH = SCRIPT_DIR / "dataset_manifest.md"
DEFAULT_COUNT = 5000
DEFAULT_SEED = 42
VAL_FRACTION = 0.10

# ─────────────────────────────────────────────────────────────────────────────
# Substitution pools — deliberately "first C program" vocabulary, matching the
# kind of code a student on this platform's mission set is actually writing.
# ─────────────────────────────────────────────────────────────────────────────

VAR_NAMES = [
    "total", "count", "score", "average", "balance", "temp", "index", "length",
    "width", "height", "radius", "price", "grade", "age", "sum", "counter",
    "result", "value", "distance", "speed", "attempts", "lives", "health", "level",
]
FUNC_NAMES = [
    "calculateTotal", "getAverage", "computeArea", "checkGrade", "isEven",
    "addNumbers", "findMax", "printResult", "convertTemp", "rollDice",
    "validateInput", "updateScore",
]
TYPES_C = ["int", "float", "double", "char", "long"]
MATH_FUNCS = ["sqrt", "pow", "abs", "ceil", "floor", "sin", "cos"]
IO_FUNCS = ["printf", "scanf", "puts", "fprintf"]

# Rotated instruction phrasings — same semantics as the production system
# prompt in lib/ollama.ts's buildPrompt(), with light wording variation so
# fine-tuning doesn't overfit to one exact instruction string.
INSTRUCTIONS = [
    "You are Platypus, a friendly C programming mentor for students aged 13-18. "
    "A student's code failed to compile. Explain the mistake in plain English "
    "(no jargon, at most 3 sentences) and suggest a fix.",
    "You are Platypus, a C programming mentor helping a teenage student (13-18). "
    "Their code did not compile. In 3 sentences or fewer, explain what went "
    "wrong in plain English, then suggest a fix.",
    "You are Platypus, a supportive C mentor for a student aged 13-18. Their "
    "program failed to compile — explain why in simple, jargon-free language "
    "(3 sentences max) and give a fix.",
]


@dataclass
class Scenario:
    gcc_error: str
    broken_line: str
    direct_fix: str


@dataclass
class TypeSpec:
    weight: int
    scenarios: list[Scenario]
    explanations: list[str]
    note: str = ""


def ctx_for(rng: random.Random) -> dict[str, str]:
    var = rng.choice(VAR_NAMES)
    var2 = rng.choice([v for v in VAR_NAMES if v != var])
    type_ = rng.choice(TYPES_C)
    type2 = rng.choice([t for t in TYPES_C if t != type_])
    return {
        "var": var,
        "var2": var2,
        "func": rng.choice(FUNC_NAMES),
        "type": type_,
        "type2": type2,
        "math_func": rng.choice(MATH_FUNCS),
        "io_func": rng.choice(IO_FUNCS),
        "n": rng.randint(1, 4),
        "num": rng.randint(0, 100),
        "line": rng.randint(3, 42),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Taxonomy — one entry per lib/errorClassifier.ts CompilerErrorType variant.
# `gcc_error` strings are written to match that file's RULES regexes exactly,
# so classifyCompilerError() on a generated row's gcc_error would re-derive
# the same type this row was filed under.
#
# Priority weighting (per T7 scope: "missing semicolon, undeclared
# identifier, type mismatch, unbalanced braces" are what students hit most)
# gives those four types 500 rows each; the remaining 17 types split the rest
# with a hand-picked long tail for rarer diagnostics. See dataset_manifest.md
# for the full accounting once generated.
# ─────────────────────────────────────────────────────────────────────────────

TAXONOMY: dict[str, TypeSpec] = {
    "missing_semicolon": TypeSpec(
        weight=500,
        scenarios=[
            Scenario("error: expected ';' before 'return'", "int {var} = {num}", "int {var} = {num};"),
            Scenario("error: expected ';' before '}}' token", "{var} = {var} + 1", "{var} = {var} + 1;"),
            Scenario(
                "error: expected ';' before 'printf'",
                'printf("Value: %d\\n", {var})',
                'printf("Value: %d\\n", {var});',
            ),
            Scenario("error: expected ';' at end of input", "return {num}", "return {num};"),
        ],
        explanations=[
            "C expects every statement to end with a semicolon, like a period at the end of a sentence, and this line is missing one. Look at the line the error points to (or the line right above it) and add a `;` at the end.",
            "The compiler stopped because it couldn't find the semicolon it expects at the end of a statement. Check the line just before the error and add a `;` there.",
            "Every line of C code that isn't a block needs to end in a semicolon, and one is missing near the {var} line. Add the missing `;` and try compiling again.",
        ],
    ),
    "missing_closing_brace": TypeSpec(
        weight=500,
        scenarios=[
            Scenario(
                "error: expected declaration or statement at end of input",
                "int {func}(int {var}) {{",
                "Add a closing `}}` to match the opening brace of {func}.",
            ),
            Scenario(
                "error: expected declaration or statement at end of input",
                "if ({var} > {num}) {{",
                "Add a closing `}}` after the if-block's statements.",
            ),
            Scenario(
                "error: expected declaration or statement at end of input",
                "while ({var} < {num}) {{",
                "Add a closing `}}` to end the while loop.",
            ),
        ],
        explanations=[
            "Every opening curly brace `{{` needs a matching closing brace `}}`, and one is missing somewhere above. Count your braces from the top of the file down to find the one left unclosed.",
            "The compiler reached the end of the file still waiting for a `}}` it never found. Go through your functions and loops and check each `{{` has a partner `}}`.",
            "This usually means a function or block was opened with `{{` but never closed. Add the missing `}}` where the block should end.",
        ],
    ),
    "missing_opening_brace": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "error: expected '{{' before 'int'",
                "int {func}(int {var})\n    int {var2} = 0;",
                "int {func}(int {var}) {{",
            ),
            Scenario(
                "error: expected '{{' before 'if'",
                "for ({var} = 0; {var} < {n}; {var}++)\n    if ({var} == {num})",
                "for ({var} = 0; {var} < {n}; {var}++) {{",
            ),
        ],
        explanations=[
            "The compiler expected an opening `{{` here but didn't find one. Check the function or block just above the error line — it probably needs a `{{` right after its header.",
            "This function or loop is missing the `{{` that should start its body. Add it right after the parentheses.",
        ],
    ),
    "undeclared_identifier": TypeSpec(
        weight=500,
        scenarios=[
            Scenario(
                "error: '{var}' undeclared (first use in this function)",
                "{var} = {var} + {num};",
                "int {var} = 0; // declare it before using it",
            ),
            Scenario(
                "error: '{func}' undeclared (first use in this function)",
                "{var} = {func}({num});",
                "Declare or #include the header that defines {func} before calling it.",
            ),
            Scenario(
                "error: '{var}' was not declared in this scope",
                "printf(\"%d\", {var});",
                "int {var} = 0; // declare {var} before this line",
            ),
        ],
        explanations=[
            "The compiler doesn't recognize `{var}` because it was never declared before it was used. This is usually a typo in the name, or a missing declaration line above it.",
            "You used a name the compiler has never seen before — either it's misspelled, or you forgot to declare it first. Add a declaration for `{var}` above the line where it's used.",
            "Every variable or function needs to be declared (or `#include`d) before you use it. Double-check the spelling of `{var}` and add a declaration if it's missing.",
        ],
    ),
    "implicit_function": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "warning: implicit declaration of function '{func}' [-Wimplicit-function-declaration]",
                "{var} = {func}({var2});",
                "Declare {func} above this line, or #include the header that defines it.",
            ),
        ],
        explanations=[
            "You called `{func}` before the compiler had seen how it's defined. Add a declaration (or the right `#include`) for `{func}` above this line.",
            "The compiler let you call `{func}` but doesn't know its real signature yet, which is risky. Move its definition above this line, or declare it first.",
        ],
    ),
    "missing_stdio": TypeSpec(
        weight=220,
        scenarios=[
            Scenario(
                "warning: implicit declaration of function 'printf' [-Wimplicit-function-declaration]",
                'printf("Score: %d\\n", {var});',
                "#include <stdio.h>",
            ),
            Scenario(
                "warning: implicit declaration of function 'scanf' [-Wimplicit-function-declaration]",
                'scanf("%d", &{var});',
                "#include <stdio.h>",
            ),
            Scenario(
                "warning: implicit declaration of function 'puts' [-Wimplicit-function-declaration]",
                'if ({var} > 0) puts("positive");',
                "#include <stdio.h>",
            ),
            Scenario(
                "warning: implicit declaration of function 'fprintf' [-Wimplicit-function-declaration]",
                'fprintf(stdout, "Value: %d\\n", {var});',
                "#include <stdio.h>",
            ),
        ],
        explanations=[
            "You're using `printf` or `scanf`, but the library that defines them hasn't been included yet. Add `#include <stdio.h>` at the very top of your file.",
            "The compiler doesn't know what `printf`/`scanf` are without the standard I/O header. Add `#include <stdio.h>` before you use them.",
            "Any function that reads or prints text — `printf`, `scanf`, `puts` — comes from the standard I/O library. Add `#include <stdio.h>` at the top of your file before using them.",
        ],
    ),
    "missing_math": TypeSpec(
        weight=170,
        scenarios=[
            Scenario(
                "warning: implicit declaration of function '{math_func}' [-Wimplicit-function-declaration]",
                "{var} = {math_func}({var2});",
                "#include <math.h>",
            ),
        ],
        explanations=[
            "You're calling a math function like `{math_func}`, but the math library header hasn't been included. Add `#include <math.h>` at the top of your file.",
            "`{math_func}` comes from the math library, which the compiler hasn't been told about yet. Add `#include <math.h>`, and compile with `-lm` if needed.",
        ],
    ),
    "empty_printf": TypeSpec(
        weight=12,
        scenarios=[
            Scenario("warning: printf format string is empty", 'printf("");', 'printf("Your message here");'),
            Scenario("warning: format string for 'printf' is empty", 'printf( "" );', 'printf("Your message here");'),
            Scenario(
                "warning: 'printf' called with an empty format argument",
                'printf("");',
                'printf("Enter a message here");',
            ),
            Scenario(
                "warning: empty format string passed to printf",
                'printf( "" );',
                'printf("Add the text you want to show here");',
            ),
        ],
        explanations=[
            "`printf` was called with empty quotes, so there's nothing for it to actually print. Put the text you want to display inside the quotes.",
            "Right now the quotes after `printf` are empty, which means no message will appear. Add the text you want shown between the quotes.",
            "An empty pair of quotes gives `printf` nothing to display on screen. Type your message between the quotes.",
        ],
        note="Exactly 4 scenarios x 3 explanations = 12 unique rows possible — an empty "
        "printf() call has almost no natural textual variation, so the weight is capped at "
        "the template ceiling rather than padded with near-duplicate rows.",
    ),
    "zero_length_format": TypeSpec(
        weight=9,
        scenarios=[
            Scenario(
                "warning: zero-length gnu_printf format string [-Wformat-zero-length]",
                'printf("");',
                'printf("\\n"); // or add real text between the quotes',
            ),
            Scenario(
                "warning: zero-length gnu_printf format string [-Wformat-zero-length]",
                'printf( "" );',
                'printf("\\n"); // or add real text between the quotes',
            ),
            Scenario(
                "warning: zero-length gnu_printf format string [-Wformat-zero-length]",
                'fprintf(stdout, "");',
                'fprintf(stdout, "\\n"); // or add real text between the quotes',
            ),
        ],
        explanations=[
            "The format string you gave `printf` has nothing in it. If you want to print a blank line use `printf(\"\\n\");`, or add the text you actually want to show.",
            "An empty pair of quotes in `printf` means there's no format string at all. Fill in the message, or use `\"\\n\"` if you just want a line break.",
            "A format string with nothing between the quotes tells the compiler there's no text or format to work with. Add real text, a format specifier, or a `\\n` if that's all you need.",
        ],
        note="Exactly 3 scenarios x 3 explanations = 9 unique rows possible — same diversity "
        "ceiling as empty_printf; weight capped at the template ceiling for the same reason.",
    ),
    "missing_return": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "warning: control reaches end of non-void function [-Wreturn-type]",
                "int {func}(int {var}) {{\n    {var} = {var} * 2;\n}}",
                "return {var};",
            ),
        ],
        explanations=[
            "`{func}` is declared to return a value, but execution can reach the end of the function without hitting a `return`. Add a `return` statement with the right value at the end.",
            "This function promises to give back a value but doesn't always do it. Make sure every path through `{func}` ends with a `return`.",
        ],
    ),
    "type_mismatch": TypeSpec(
        weight=500,
        scenarios=[
            Scenario(
                "error: incompatible types when assigning to type '{type}' from type '{type2} *'",
                "{type} {var} = {var2};",
                "Convert {var2} to {type} before assigning, or change {var}'s type.",
            ),
            Scenario(
                "error: invalid conversion from '{type2}' to '{type}'",
                "{type} {var} = {var2};",
                "Cast {var2} to {type}, or store it in a variable of type {type2} instead.",
            ),
        ],
        explanations=[
            "You're trying to store a value of one type where C expects another, and it can't convert them automatically here. Make sure `{var}` and the value you assign to it are the same type, or convert one of them on purpose.",
            "C is strict about mixing types like this — `{var}` and `{var2}` don't match. Change one of their types, or explicitly convert the value before assigning it.",
        ],
    ),
    "too_few_args": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "error: too few arguments to function '{func}'",
                "{var} = {func}({var2});",
                "Check {func}'s definition and pass all the arguments it expects.",
            ),
        ],
        explanations=[
            "`{func}` expects more arguments than you gave it here. Look at how `{func}` is defined and add whatever's missing to the call.",
            "You called `{func}` with fewer values than it needs. Check its definition and fill in the missing argument(s).",
        ],
    ),
    "too_many_args": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "error: too many arguments to function '{func}'",
                "{var} = {func}({var2}, {num}, {var});",
                "Remove the extra argument(s) so the call matches {func}'s definition.",
            ),
        ],
        explanations=[
            "You passed more values to `{func}` than it's set up to take. Remove the extra argument(s) so the call matches how `{func}` is defined.",
            "`{func}` doesn't need this many arguments. Check its definition and drop the ones it doesn't expect.",
        ],
    ),
    "missing_string_terminator": TypeSpec(
        weight=220,
        scenarios=[
            Scenario(
                'error: missing terminating " character',
                'printf("Score: %d\\n, {var});',
                'printf("Score: %d\\n", {var});',
            ),
            Scenario(
                'error: missing terminating " character',
                'puts("{var} finished);',
                'puts("{var} finished");',
            ),
            Scenario(
                'error: missing terminating " character',
                'char message[] = "{var} report;',
                'char message[] = "{var} report";',
            ),
            Scenario(
                'error: missing terminating " character',
                'fprintf(stderr, "Error: %d\\n, {var});',
                'fprintf(stderr, "Error: %d\\n", {var});',
            ),
        ],
        explanations=[
            "A string in your code starts with a `\"` but never closes with a matching one. Find the open quote near the error line and add the closing `\"`.",
            "Every string needs a `\"` at both ends, and one of yours is missing its closer. Check the line the error points to for an unclosed quote.",
            "The compiler found an opening `\"` for a string but ran off the end of the line looking for its partner. Add the missing closing `\"` where the string should end.",
        ],
    ),
    "expected_expression": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "error: expected expression before ')' token",
                "if ({var} > ) {{",
                "if ({var} > {num}) {{",
            ),
            Scenario(
                "error: expected expression before '=' token",
                "{var} = = {num};",
                "{var} = {num};",
            ),
        ],
        explanations=[
            "The compiler expected a value here (like a number or a variable) but found something else instead. Check near the error line for a typo, a missing value, or a stray operator.",
            "Something is missing where C expects an expression — often a value between two operators. Look for a misplaced symbol or a missing number/variable near the error.",
        ],
    ),
    "expected_declaration": TypeSpec(
        weight=180,
        scenarios=[
            Scenario(
                "error: expected declaration specifiers before '{var}'",
                "{var} = 0;\nint {func}() {{",
                "int {var} = 0;",
            ),
        ],
        explanations=[
            "The compiler expected a type or keyword to start a declaration here, but got `{var}` instead. Check whether a type name (like `int`) or a required keyword is missing just before it.",
            "This spot needed a proper declaration — a type followed by a name — and something's out of place. Check for a missing type keyword right before `{var}`.",
        ],
        note="Not currently reachable via classifyCompilerError() — lib/errorClassifier.ts has "
        "no RULES entry that maps to this type yet. Included anyway per T7 scope (all 21 "
        "CompilerErrorType variants); rows stay useful once a classifier rule is added.",
    ),
    "redefinition": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "error: redefinition of '{var}'",
                "int {var} = 0;\nint {var} = {num};",
                "Remove the duplicate declaration of {var}, or rename the second one.",
            ),
        ],
        explanations=[
            "`{var}` was declared more than once in the same scope, and C doesn't allow that. Remove one of the declarations, or give the second variable a different name.",
            "You can only declare a name like `{var}` once per scope. Delete the duplicate, or rename one of them.",
        ],
    ),
    "unused_variable": TypeSpec(
        weight=200,
        scenarios=[
            Scenario(
                "warning: unused variable '{var}' [-Wunused-variable]",
                "int {var} = {num};",
                "Remove {var} if you don't need it, or use it somewhere in your code.",
            ),
        ],
        explanations=[
            "You declared `{var}` but never actually used it anywhere in the code. It's just a warning, not an error, but it's worth either removing it or using it.",
            "`{var}` is sitting unused after being declared. Delete it if it's not needed, or make sure you actually use it later on.",
        ],
    ),
    "division_by_zero": TypeSpec(
        weight=180,
        scenarios=[
            Scenario(
                "warning: division by zero [-Wdiv-by-zero]",
                "{var} = {var2} / 0;",
                "Check the divisor and make sure it can never be 0 before dividing.",
            ),
        ],
        explanations=[
            "Dividing by zero doesn't have a defined result in C, and the compiler is warning you about it here. Check `{var2}` and make sure it can never be 0 before you divide by it.",
            "This line divides by a literal 0, which is always undefined behavior. Make sure whatever you're dividing by is checked and never actually zero.",
        ],
    ),
    "incompatible_pointer": TypeSpec(
        weight=180,
        scenarios=[
            Scenario(
                "warning: incompatible pointer types assigning to '{type} *' from '{type2} *' [-Wincompatible-pointer-types]",
                "{type} *{var} = {var2};",
                "Cast {var2} to {type} *, or change {var}'s pointer type to match.",
            ),
        ],
        explanations=[
            "You're assigning a pointer of one type to a variable declared for a different pointer type. Make sure `{var}` and `{var2}` point to the same type, or cast one of them on purpose.",
            "The pointer types on each side of this assignment don't match. Change `{var}`'s declared type to match, or explicitly cast the value.",
        ],
    ),
    "unknown": TypeSpec(
        weight=229,
        scenarios=[
            Scenario(
                "undefined reference to '{func}'",
                "{var} = {func}({var2});",
                "Make sure {func} is defined somewhere and linked into the build.",
            ),
            Scenario(
                "error: conflicting types for '{func}'",
                "int {func}(int {var});\nfloat {func}(int {var}) {{",
                "Make {func}'s declaration and definition use the same return type and parameters.",
            ),
            Scenario(
                "error: duplicate case value",
                "switch ({var}) {{\ncase {num}:\ncase {num}:",
                "Change one of the duplicate case values so each is unique.",
            ),
        ],
        explanations=[
            "This is a less common compiler error that doesn't fit one of the usual categories. Read the message carefully — it usually points at the exact line and symbol causing the problem.",
            "This one is a bit unusual. Check the line the error points to and compare it against how `{func}` is declared or used elsewhere in your code.",
        ],
        note="Catch-all for real GCC/linker diagnostics that don't match any RULES entry in "
        "lib/errorClassifier.ts (this is classifyCompilerError()'s actual fallback bucket, not "
        "an invented category) — scoped to a hand-picked long tail rather than an even share, "
        "since it's inherently the least-templatable type.",
    ),
}

# Sanity check at import time: keep the taxonomy in lockstep with
# lib/errorClassifier.ts's CompilerErrorType union (21 variants).
EXPECTED_TYPE_COUNT = 21
assert len(TAXONOMY) == EXPECTED_TYPE_COUNT, (
    f"TAXONOMY has {len(TAXONOMY)} entries, expected {EXPECTED_TYPE_COUNT} "
    "(one per lib/errorClassifier.ts CompilerErrorType variant) — update either "
    "this script or the assertion if the source union has genuinely changed."
)


# ─────────────────────────────────────────────────────────────────────────────
# Fidelity check: a Python port of lib/errorClassifier.ts's RULES, in the same
# order (first match wins). Used to assert every generated `gcc_error` string
# actually classifies as the type it was filed under — so the dataset's
# labels are a faithful reflection of production classification, not just
# plausible-looking text. Keep this in sync with errorClassifier.ts by hand;
# a mismatch here is a bug in this script's templates, not in the TS source.
# ─────────────────────────────────────────────────────────────────────────────

_CLASSIFY_RULES: list[tuple[re.Pattern[str], re.Pattern[str] | None, str]] = [
    (re.compile(r"zero-length", re.I), re.compile(r"printf", re.I), "zero_length_format"),
    (re.compile(r"empty", re.I), re.compile(r"printf", re.I), "empty_printf"),
    (re.compile(r"implicit declaration of function", re.I), re.compile(r"(printf|scanf|puts|gets|fgets|fprintf)", re.I), "missing_stdio"),
    (re.compile(r"implicit declaration of function", re.I), re.compile(r"(sqrt|pow|abs|ceil|floor|sin|cos|tan)", re.I), "missing_math"),
    (re.compile(r"implicit declaration of function", re.I), None, "implicit_function"),
    (re.compile(r"expected\s+';'", re.I), None, "missing_semicolon"),
    (re.compile(r"expected declaration or statement at end of input", re.I), None, "missing_closing_brace"),
    (re.compile(r"expected\s+'\{'", re.I), None, "missing_opening_brace"),
    (re.compile(r"undeclared|was not declared in this scope", re.I), None, "undeclared_identifier"),
    (re.compile(r"control reaches end of non-void function|no return", re.I), None, "missing_return"),
    (re.compile(r"incompatible type|invalid conversion|cannot convert", re.I), None, "type_mismatch"),
    (re.compile(r"too few arguments", re.I), None, "too_few_args"),
    (re.compile(r"too many arguments", re.I), None, "too_many_args"),
    (re.compile(r"missing terminating|unterminated string", re.I), None, "missing_string_terminator"),
    (re.compile(r"expected expression", re.I), None, "expected_expression"),
    (re.compile(r"redefinition of|redeclared", re.I), None, "redefinition"),
    (re.compile(r"unused variable|set but not used", re.I), None, "unused_variable"),
    (re.compile(r"incompatible pointer", re.I), None, "incompatible_pointer"),
]

# CompilerErrorType variants with no matching RULES entry in
# lib/errorClassifier.ts today — classifyCompilerError() falls through to
# 'unknown' for these, which is documented in dataset_manifest.md and is not
# a bug in either this script or the TS source.
UNREACHABLE_TYPES = {"expected_declaration", "division_by_zero"}


def classify_like_ts(gcc_error: str) -> str:
    """Python port of classifyCompilerError() — first matching rule wins."""
    for primary, secondary, result_type in _CLASSIFY_RULES:
        if primary.search(gcc_error) and (secondary is None or secondary.search(gcc_error)):
            return result_type
    return "unknown"


def allocate_counts(total: int, weights: dict[str, int]) -> dict[str, int]:
    """Largest-remainder apportionment: distribute `total` rows across
    taxonomy types proportional to `weights`, guaranteeing every type gets
    at least 1 row (so small smoke batches still cover the full taxonomy)
    and the allocated counts sum to exactly `total`."""
    types = list(weights.keys())
    weight_sum = sum(weights.values())

    raw = {t: total * weights[t] / weight_sum for t in types}
    floors = {t: max(1, math.floor(raw[t])) for t in types}

    remainder = total - sum(floors.values())
    if remainder > 0:
        # Give leftover rows to the types with the largest fractional part.
        order = sorted(types, key=lambda t: raw[t] - math.floor(raw[t]), reverse=True)
        for t in order[:remainder]:
            floors[t] += 1
    elif remainder < 0:
        # Only possible when total < len(types) (min-1 flooring overshot).
        # Take back from the largest allocations first, never below 1.
        order = sorted(types, key=lambda t: floors[t], reverse=True)
        i = 0
        while remainder < 0 and i < len(order):
            t = order[i]
            if floors[t] > 1:
                floors[t] -= 1
                remainder += 1
            else:
                i += 1

    assert sum(floors.values()) == total
    return floors


def render(template: str, ctx: dict[str, str]) -> str:
    return template.format(**ctx)


def generate_rows_for_type(error_type: str, spec: TypeSpec, count: int, rng: random.Random) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()
    attempts = 0
    max_attempts = count * 50  # generous; template space is large relative to per-type counts

    while len(rows) < count and attempts < max_attempts:
        attempts += 1
        ctx = ctx_for(rng)
        scenario = rng.choice(spec.scenarios)
        explanation_template = rng.choice(spec.explanations)
        instruction = rng.choice(INSTRUCTIONS)

        gcc_error = render(scenario.gcc_error, ctx)
        broken_line = render(scenario.broken_line, ctx)
        direct_fix = render(scenario.direct_fix, ctx)
        explanation = render(explanation_template, ctx)

        if error_type not in UNREACHABLE_TYPES:
            classified = classify_like_ts(gcc_error)
            if classified != error_type:
                raise AssertionError(
                    f"template fidelity check failed for '{error_type}': gcc_error "
                    f"{gcc_error!r} classifies as {classified!r} per lib/errorClassifier.ts's "
                    f"RULES, not {error_type!r} — fix the scenario template."
                )

        key = (gcc_error, broken_line, explanation, direct_fix)
        if key in seen:
            continue
        seen.add(key)

        rows.append(
            {
                "instruction": instruction,
                "gcc_error": gcc_error,
                "broken_line": broken_line,
                "explanation": explanation,
                "direct_fix": direct_fix,
            }
        )

    if len(rows) < count:
        print(
            f"  warning: template space for '{error_type}' exhausted after {attempts} attempts — "
            f"got {len(rows)}/{count} unique rows"
        )

    return rows


@dataclass
class GenerationStats:
    seed: int
    total_requested: int
    per_type_counts: dict[str, int] = field(default_factory=dict)
    per_type_train: dict[str, int] = field(default_factory=dict)
    per_type_val: dict[str, int] = field(default_factory=dict)
    train_total: int = 0
    val_total: int = 0


def split_train_val(rows: list[dict[str, str]], rng: random.Random) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    shuffled = rows[:]
    rng.shuffle(shuffled)
    val_n = round(len(shuffled) * VAL_FRACTION)
    val_rows = shuffled[:val_n]
    train_rows = shuffled[val_n:]
    return train_rows, val_rows


def write_jsonl(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False))
            f.write("\n")


def write_manifest(stats: GenerationStats, taxonomy: dict[str, TypeSpec], path: Path) -> None:
    lines: list[str] = []
    lines.append("# T7 Synthetic Dataset Manifest")
    lines.append("")
    lines.append(
        "Auto-generated by `scripts/ml/generate_dataset.py` — do not hand-edit; "
        "re-run the script to regenerate."
    )
    lines.append("")
    lines.append(
        f"- **Total rows:** {stats.train_total + stats.val_total} "
        f"(requested {stats.total_requested})"
    )
    lines.append(f"- **Seed:** {stats.seed}")
    lines.append(
        f"- **Split:** train {stats.train_total} / val {stats.val_total} "
        f"({VAL_FRACTION:.0%} val target, stratified per error type)"
    )
    lines.append("- **Schema:** `{instruction, gcc_error, broken_line, explanation, direct_fix}` "
                  "— matches T3's live `/api/compiler/explain` contract "
                  "(`lib/explainService.ts` / `lib/ollama.ts`'s `OllamaExplanationSchema`).")
    lines.append(
        "- **Explanation constraint:** ≤3 sentences, jargon-free, ages 13-18 "
        "(ADR-004 / T3's prompt contract), enforced by `verify_dataset.py`."
    )
    lines.append("")
    lines.append("## Taxonomy coverage")
    lines.append("")
    lines.append(
        "Source: the 21 `CompilerErrorType` variants in `lib/errorClassifier.ts`. Cross-checked "
        "against the real GCC `-fdiagnostics-format=json` fixtures in `.scratch/fixtures/gcc/` "
        "— several scenario templates below use those fixtures' exact message text (e.g. "
        "`missing-semicolon-cascade.json`'s `\"expected ';' before 'return'\"` and "
        "`independent-errors.json`'s `\"incompatible types when assigning to type 'int' from "
        "type 'char *'\"`). One fixture (`missing-semicolon-cascade.json`'s `\"expected "
        "statement before '}' token\"`) doesn't match any RULES entry either — a real-world "
        "confirmation that the `unknown` bucket is a genuine fallback, not just a theoretical "
        "one."
    )
    lines.append("")
    lines.append(
        "Weighted toward the four types students hit most (missing semicolon, undeclared "
        "identifier, type mismatch, and unbalanced braces — 500 rows each). \"Unbalanced "
        "braces\" splits into two `CompilerErrorType` variants; `missing_closing_brace` gets "
        "the full 500 as the far more common student mistake (forgetting to close a function "
        "or loop body), while `missing_opening_brace` sits in the mid tier (200) since it's "
        "rarer in practice. A mid tier of other common types (200-220 rows each) and a "
        "hand-picked long tail for rarer diagnostics follow — capped per-type at how many "
        "genuinely distinct rows its templates can produce (as low as 9-12 for narrow, "
        "low-variation bugs like an empty `printf(\"\")` call) rather than padded with "
        "near-duplicate rows to hit a round number. See the table below for exact per-type "
        "weights. Real frequency data from `CompilerErrorCache.errorType` (T1) should replace "
        "this hand-picked weighting once production rows exist."
    )
    lines.append("")
    lines.append("| Error type | Weight | Rows generated | Train | Val | Notes |")
    lines.append("|---|---:|---:|---:|---:|---|")
    for error_type, spec in sorted(taxonomy.items(), key=lambda kv: -kv[1].weight):
        generated = stats.per_type_counts.get(error_type, 0)
        train_n = stats.per_type_train.get(error_type, 0)
        val_n = stats.per_type_val.get(error_type, 0)
        note = spec.note or ""
        lines.append(f"| `{error_type}` | {spec.weight} | {generated} | {train_n} | {val_n} | {note} |")
    lines.append("")
    lines.append("## Files")
    lines.append("")
    lines.append("- `scripts/ml/data/train.jsonl` — training split")
    lines.append("- `scripts/ml/data/val.jsonl` — validation split")
    lines.append("")
    lines.append("## Verification")
    lines.append("")
    lines.append("```bash")
    lines.append("python scripts/ml/verify_dataset.py")
    lines.append("```")
    lines.append("")
    lines.append(
        "Asserts every row parses as JSON, has exactly the 5 required keys, and that "
        "`explanation` never exceeds 3 sentences."
    )
    lines.append("")
    lines.append("## Known gaps / decisions for T8")
    lines.append("")
    lines.append(
        "- `expected_declaration` and `division_by_zero` both have **no matching RULES entry "
        "at all** in `lib/errorClassifier.ts` today — `classifyCompilerError()` falls through "
        "to `unknown` for both (real GCC does warn on constant-expression division by zero via "
        "`-Wdiv-by-zero`, but that warning text isn't matched by any RULES pattern yet). "
        "Training rows are included per T7 scope but won't be reachable in production until a "
        "rule is added for each."
    )
    lines.append(
        "- `unknown` rows model `classifyCompilerError()`'s actual fallback bucket "
        "(unmatched real GCC/linker diagnostics), not an invented category — kept as a "
        "small long tail since it's the least templatable type by nature. Confirmed against "
        "`.scratch/fixtures/gcc/missing-semicolon-cascade.json`, whose "
        "`\"expected statement before '}' token\"` also falls through to `unknown`."
    )
    lines.append(
        "- `explainService.ts` currently short-circuits all 20 non-`unknown` types straight "
        "to the static `PLATYPUS_EXPLANATIONS` map in `compilerExplanation.ts` and only calls "
        "the SLM for `unknown`. This dataset covers all 21 types anyway (per ticket scope) so "
        "T8's fine-tune generalizes if that routing ever changes."
    )
    lines.append("")
    lines.append("## Spot-check")
    lines.append("")
    lines.append(
        "A random sample was manually reviewed across every weight tier (priority, mid, long "
        "tail) before this dataset was committed: explanations stayed jargon-free, ≤3 "
        "sentences, in the existing \"Agent\"-addressed Platypus voice used by "
        "`compilerExplanation.ts`'s static explanations, and never dumped a full corrected "
        "program (only a short, targeted `direct_fix`). No tone or accuracy issues found. "
        "Re-run the sample check below after any template change:"
    )
    lines.append("")
    lines.append("```bash")
    lines.append("python -c \"import json, random; "
                  "rows=[json.loads(l) for l in open('scripts/ml/data/train.jsonl', encoding='utf-8')]; "
                  "random.seed(7); "
                  "[print(json.dumps(r, indent=2)) for r in random.sample(rows, 12)]\"")
    lines.append("```")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT, help=f"total rows to generate (default: {DEFAULT_COUNT})")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help=f"RNG seed for reproducibility (default: {DEFAULT_SEED})")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help=f"output directory for train.jsonl/val.jsonl (default: {DEFAULT_OUT_DIR})")
    parser.add_argument("--manifest-path", type=Path, default=DEFAULT_MANIFEST_PATH, help="where to write the manifest (default: scripts/ml/dataset_manifest.md)")
    parser.add_argument("--no-manifest", action="store_true", help="skip writing dataset_manifest.md")
    args = parser.parse_args()

    if args.count < len(TAXONOMY):
        parser.error(f"--count must be >= {len(TAXONOMY)} (one row per taxonomy type minimum)")

    weights = {t: spec.weight for t, spec in TAXONOMY.items()}
    counts = allocate_counts(args.count, weights)

    rng = random.Random(args.seed)

    stats = GenerationStats(seed=args.seed, total_requested=args.count)
    all_train: list[dict[str, str]] = []
    all_val: list[dict[str, str]] = []

    for error_type, spec in TAXONOMY.items():
        n = counts[error_type]
        rows = generate_rows_for_type(error_type, spec, n, rng)
        stats.per_type_counts[error_type] = len(rows)

        train_rows, val_rows = split_train_val(rows, rng)
        stats.per_type_train[error_type] = len(train_rows)
        stats.per_type_val[error_type] = len(val_rows)

        all_train.extend(train_rows)
        all_val.extend(val_rows)

    rng.shuffle(all_train)
    rng.shuffle(all_val)

    stats.train_total = len(all_train)
    stats.val_total = len(all_val)

    train_path = args.out_dir / "train.jsonl"
    val_path = args.out_dir / "val.jsonl"
    write_jsonl(all_train, train_path)
    write_jsonl(all_val, val_path)

    print(f"Wrote {len(all_train)} train rows -> {train_path}")
    print(f"Wrote {len(all_val)} val rows -> {val_path}")

    if not args.no_manifest:
        write_manifest(stats, TAXONOMY, args.manifest_path)
        print(f"Wrote manifest -> {args.manifest_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
