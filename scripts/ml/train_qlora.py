#!/usr/bin/env python3
"""
T8 — QLoRA fine-tune of Qwen2.5-Coder-3B-Instruct on T7's GCC-error dataset.

Target hardware is a Dell G15 / RTX 3050 Laptop (6GB VRAM), with a hard
budget of 4.4GB peak VRAM from doc 2's KPI table (1.6GB headroom). Every
memory-relevant default below is chosen for that ceiling, not guessed:

  * 4-bit NF4 base weights (load_in_4bit)   — 3B params in ~2.0GB
  * max_seq_length 512                      — T7's rows are short; a 2048
                                              context would buy nothing and
                                              cost activation memory
  * batch 2 x grad-accum 4                  — effective batch 8
  * gradient_checkpointing="unsloth"        — Unsloth's offloaded variant
  * adamw_8bit                              — optimiser state in 8-bit
  * LoRA r=8 / alpha=16 on all 7 attention + MLP projections

The run FAILS (exit 1) if peak VRAM exceeds the budget, so the KPI is
enforced rather than merely reported.

Prompt format is Qwen2.5 ChatML, built by prompt_format.py so it is pinned
by tests (see test_prompt_format.py). Before training starts this script
asserts that renderer is byte-identical to the tokenizer's own chat
template — a silent mismatch there trains a model that looks fine on the
loss curve and fails T9's eval.

Loss is computed over the assistant turn only (Unsloth's
train_on_responses_only), so the model is not scored on reciting the
system prompt back.

Usage
-----
    # 10-step smoke test — verifies VRAM and that loss moves, ~1 minute
    python scripts/ml/train_qlora.py --smoke

    # the real run: 1 epoch over all 4,500 training rows
    python scripts/ml/train_qlora.py

Outputs (under --output-dir):
    adapter_model.safetensors, adapter_config.json  — the LoRA adapter
    tokenizer files                                 — for T9 / T11
    training_summary.json                           — loss curve, peak VRAM,
                                                      full config, versions
"""
from __future__ import annotations

# Unsloth must be imported before transformers/trl so its patches land first.
import unsloth  # noqa: F401  (import order matters, not the name)
from unsloth import FastLanguageModel
from unsloth.chat_templates import train_on_responses_only

import argparse
import json
import platform
import sys
import time
from pathlib import Path

import torch
from datasets import load_dataset
from trl import SFTConfig, SFTTrainer

from prompt_format import (
    INSTRUCTION_PART,
    RESPONSE_PART,
    build_messages,
    format_row,
    render_chatml,
)

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_TRAIN = SCRIPT_DIR / "data" / "train.jsonl"
DEFAULT_VAL = SCRIPT_DIR / "data" / "val.jsonl"
DEFAULT_OUTPUT = SCRIPT_DIR / "outputs" / "qwen2.5-coder-3b-platypus-lora"

# Unsloth's pre-quantised mirror of Qwen/Qwen2.5-Coder-3B-Instruct: identical
# weights, ~2GB to download instead of ~6GB, and no on-the-fly quantisation
# pass at startup.
DEFAULT_MODEL = "unsloth/Qwen2.5-Coder-3B-Instruct-bnb-4bit"

# doc 2's KPI. Enforced, not advisory.
DEFAULT_VRAM_BUDGET_GB = 4.4

# The ticket's LoRA target set: all four attention projections plus all three
# MLP projections.
LORA_TARGET_MODULES = [
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
]

GB = 1024**3


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--model-name", default=DEFAULT_MODEL)
    parser.add_argument("--train-file", type=Path, default=DEFAULT_TRAIN)
    parser.add_argument("--val-file", type=Path, default=DEFAULT_VAL)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)

    parser.add_argument("--max-seq-length", type=int, default=512)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument(
        "--warmup-steps",
        type=int,
        default=None,
        help="LR warmup steps (default: 5, or 2 under --smoke so the 10-step loss drop is visible)",
    )
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=3407)

    parser.add_argument("--lora-r", type=int, default=8)
    parser.add_argument("--lora-alpha", type=int, default=16)
    parser.add_argument("--lora-dropout", type=float, default=0.0)

    parser.add_argument(
        "--num-train-epochs",
        type=float,
        default=1.0,
        help="epochs over the training split (default: 1, the handoff setting)",
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=-1,
        help="hard step cap; -1 (default) means run --num-train-epochs instead",
    )
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="10-step smoke test: verifies VRAM headroom and that loss moves",
    )

    parser.add_argument("--logging-steps", type=int, default=1)
    parser.add_argument("--vram-budget-gb", type=float, default=DEFAULT_VRAM_BUDGET_GB)
    parser.add_argument(
        "--max-truncation-frac",
        type=float,
        default=0.01,
        help="abort if more than this fraction of rows exceed --max-seq-length",
    )
    parser.add_argument("--no-eval", action="store_true", help="skip the final validation pass")
    parser.add_argument(
        "--skip-template-check",
        action="store_true",
        help="skip the tokenizer chat-template parity assertion (not recommended)",
    )
    return parser.parse_args()


def assert_template_parity(tokenizer, sample_row: dict) -> None:
    """Fail loudly if prompt_format.py and the tokenizer disagree.

    These must be byte-identical: prompt_format.py's markers drive the
    response-only masking and T9's inference prompt, while the tokenizer's
    template is what actually ships with the model. A mismatch still trains
    to a falling loss and only surfaces as a bad eval.
    """
    messages = build_messages(sample_row)
    ours = render_chatml(messages)
    theirs = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
    if ours == theirs:
        print("  chat-template parity: OK (renderer matches tokenizer byte-for-byte)")
        return

    print(
        "\nFATAL: prompt_format.render_chatml() does not match the tokenizer's chat template.",
        file=sys.stderr,
    )
    print(f"  ours   ({len(ours)} chars): {ours[:220]!r}", file=sys.stderr)
    print(f"  theirs ({len(theirs)} chars): {theirs[:220]!r}", file=sys.stderr)
    for i, (a, b) in enumerate(zip(ours, theirs)):
        if a != b:
            print(
                f"  first difference at char {i}: "
                f"{ours[max(0, i - 40):i + 40]!r} vs {theirs[max(0, i - 40):i + 40]!r}",
                file=sys.stderr,
            )
            break
    raise SystemExit(
        "Refusing to train on a template the model was not instruction-tuned with.\n"
        "Fix prompt_format.py (and its tests) to match, or pass --skip-template-check "
        "if the difference is understood and intentional."
    )


def audit_token_lengths(dataset, tokenizer, max_seq_length: int, limit_frac: float) -> dict:
    """Report the length distribution and refuse to train on mass truncation.

    A row longer than max_seq_length loses the tail of its assistant turn —
    i.e. the model is taught to emit JSON that never closes.
    """
    lengths = [len(ids) for ids in tokenizer(dataset["text"], add_special_tokens=False)["input_ids"]]
    lengths.sort()
    n = len(lengths)
    over = sum(1 for length in lengths if length > max_seq_length)
    stats = {
        "rows": n,
        "min": lengths[0],
        "mean": round(sum(lengths) / n, 1),
        "p50": lengths[n // 2],
        "p99": lengths[min(n - 1, int(n * 0.99))],
        "max": lengths[-1],
        "over_max_seq_length": over,
        "over_frac": round(over / n, 4),
    }
    print(
        f"  token lengths: min {stats['min']} / mean {stats['mean']} / p50 {stats['p50']} "
        f"/ p99 {stats['p99']} / max {stats['max']}"
    )
    print(f"  rows over max_seq_length={max_seq_length}: {over} ({stats['over_frac']:.2%})")
    if over / n > limit_frac:
        raise SystemExit(
            f"Refusing to train: {over}/{n} rows ({over / n:.2%}) exceed max_seq_length={max_seq_length}, "
            f"above the --max-truncation-frac={limit_frac:.2%} threshold. Their assistant JSON would be "
            "truncated mid-object. Raise --max-seq-length (costs VRAM) or shorten the rows."
        )
    return stats


def build_sft_config(args, output_dir: Path, use_bf16: bool, max_steps: int, epochs: float) -> SFTConfig:
    """Assemble SFTConfig across TRL's renamed sequence-length field.

    TRL renamed SFTConfig.max_seq_length to max_length in 0.20; accept
    whichever this install exposes so the pinned 512 always lands.
    """
    kwargs = dict(
        output_dir=str(output_dir),
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        warmup_steps=args.warmup_steps,
        num_train_epochs=epochs,
        max_steps=max_steps,
        learning_rate=args.learning_rate,
        logging_steps=args.logging_steps,
        optim="adamw_8bit",
        weight_decay=args.weight_decay,
        lr_scheduler_type="linear",
        seed=args.seed,
        fp16=not use_bf16,
        bf16=use_bf16,
        dataset_text_field="text",
        dataset_num_proc=1,  # Windows spawn-based multiprocessing is not worth it here
        packing=False,  # packing would merge rows and blur the masking boundary
        report_to="none",
        save_strategy="no",  # the adapter is saved explicitly at the end
    )

    fields = getattr(SFTConfig, "__dataclass_fields__", {})
    if "max_length" in fields:
        kwargs["max_length"] = args.max_seq_length
    elif "max_seq_length" in fields:
        kwargs["max_seq_length"] = args.max_seq_length
    else:  # pragma: no cover - guards a future TRL rename
        raise SystemExit("Could not find a sequence-length field on this TRL SFTConfig.")

    return SFTConfig(**kwargs)


def main() -> int:
    args = parse_args()

    if not torch.cuda.is_available():
        raise SystemExit("CUDA is not available — this script fine-tunes on a local NVIDIA GPU.")

    max_steps = 10 if args.smoke else args.max_steps
    # transformers ignores num_train_epochs whenever max_steps > 0; pass both
    # through unchanged and record which one actually governed the run.
    governed_by = "max_steps" if max_steps > 0 else "num_train_epochs"
    if args.warmup_steps is None:
        args.warmup_steps = 2 if args.smoke else 5

    device_name = torch.cuda.get_device_name(0)
    total_vram = torch.cuda.get_device_properties(0).total_memory
    print("=" * 78)
    print("T8 — QLoRA fine-tune: Qwen2.5-Coder-3B-Instruct on T7's GCC-error dataset")
    print("=" * 78)
    print(f"GPU: {device_name} ({total_vram / GB:.2f} GB total)")
    print(
        f"Mode: {'SMOKE (10 steps)' if args.smoke else f'{args.num_train_epochs} epoch(s)'} "
        f"(governed by {governed_by})"
    )
    print(f"VRAM budget: {args.vram_budget_gb} GB (enforced)")

    # Reset before the model is loaded so the peak includes the base weights,
    # not just the training activations.
    torch.cuda.reset_peak_memory_stats()
    torch.cuda.empty_cache()

    print("\n[1/6] Loading base model in 4-bit ...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model_name,
        max_seq_length=args.max_seq_length,
        dtype=None,  # auto: bf16 on Ampere and newer
        load_in_4bit=True,
    )
    base_model_peak = torch.cuda.max_memory_reserved()
    print(f"  base model resident: {base_model_peak / GB:.2f} GB reserved")

    print("\n[2/6] Attaching LoRA adapters ...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=LORA_TARGET_MODULES,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=args.seed,
        use_rslora=False,
        loftq_config=None,
    )
    # peft's own counter, not a naive sum(p.numel()): a 4-bit Params4bit tensor's
    # numel() reports its packed uint8 storage size (roughly half the logical
    # element count), so a plain sum() undercounts total_params against the
    # figure Unsloth's own startup banner prints.
    trainable, total_params = model.get_nb_trainable_parameters()
    print(f"  trainable: {trainable:,} / {total_params:,} ({trainable / total_params:.4%})")

    print("\n[3/6] Building the ChatML dataset ...")
    for path in (args.train_file, args.val_file):
        if not path.exists():
            raise SystemExit(f"Dataset file not found: {path} — run scripts/ml/generate_dataset.py first (T7).")

    raw = load_dataset(
        "json",
        data_files={"train": str(args.train_file), "validation": str(args.val_file)},
    )
    if not args.skip_template_check:
        assert_template_parity(tokenizer, raw["train"][0])

    dataset = raw.map(format_row, remove_columns=raw["train"].column_names)
    print(f"  train rows: {len(dataset['train'])} | val rows: {len(dataset['validation'])}")
    length_stats = audit_token_lengths(
        dataset["train"], tokenizer, args.max_seq_length, args.max_truncation_frac
    )

    print("\n[4/6] Configuring the trainer ...")
    use_bf16 = torch.cuda.is_bf16_supported()
    print(f"  precision: {'bf16' if use_bf16 else 'fp16'}")
    print(f"  effective batch: {args.batch_size} x {args.grad_accum} = {args.batch_size * args.grad_accum}")

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        args=build_sft_config(args, args.output_dir, use_bf16, max_steps, args.num_train_epochs),
    )

    # Mask everything before the assistant turn so the loss only covers the
    # JSON the model is meant to produce.
    trainer = train_on_responses_only(
        trainer,
        instruction_part=INSTRUCTION_PART,
        response_part=RESPONSE_PART,
    )
    print(f"  loss masked to the span after {RESPONSE_PART!r}")

    print("\n[5/6] Training ...")
    started = time.time()
    result = trainer.train()
    elapsed = time.time() - started

    peak_reserved = torch.cuda.max_memory_reserved()
    print(f"\n  wall time: {elapsed / 60:.2f} min")
    print(f"  final train loss: {result.training_loss:.4f}")

    losses = [entry["loss"] for entry in trainer.state.log_history if "loss" in entry]
    if len(losses) >= 2:
        print(f"  loss: {losses[0]:.4f} (first logged step) -> {losses[-1]:.4f} (last)")

    eval_metrics = {}
    if not args.no_eval:
        print("\n  running validation ...")
        eval_metrics = trainer.evaluate()
        print(f"  eval loss: {eval_metrics.get('eval_loss', float('nan')):.4f}")
    peak_overall = torch.cuda.max_memory_reserved()

    print("\n[6/6] Saving the adapter ...")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"  adapter + tokenizer -> {args.output_dir}")

    summary = {
        "ticket": "T8",
        "mode": "smoke" if args.smoke else "full",
        "model_name": args.model_name,
        "gpu": device_name,
        "gpu_total_vram_gb": round(total_vram / GB, 3),
        "peak_vram_gb": round(peak_overall / GB, 3),
        "peak_vram_after_training_gb": round(peak_reserved / GB, 3),
        "base_model_vram_gb": round(base_model_peak / GB, 3),
        "vram_budget_gb": args.vram_budget_gb,
        "within_budget": peak_overall / GB <= args.vram_budget_gb,
        "wall_time_min": round(elapsed / 60, 3),
        "train_rows": len(dataset["train"]),
        "val_rows": len(dataset["validation"]),
        "token_length_stats": length_stats,
        "config": {
            "max_seq_length": args.max_seq_length,
            "per_device_train_batch_size": args.batch_size,
            "gradient_accumulation_steps": args.grad_accum,
            "effective_batch_size": args.batch_size * args.grad_accum,
            "num_train_epochs": args.num_train_epochs,
            "max_steps": max_steps,
            "governed_by": governed_by,
            "learning_rate": args.learning_rate,
            "warmup_steps": args.warmup_steps,
            "weight_decay": args.weight_decay,
            "lr_scheduler_type": "linear",
            "optim": "adamw_8bit",
            "precision": "bf16" if use_bf16 else "fp16",
            "gradient_checkpointing": "unsloth",
            "load_in_4bit": True,
            "lora_r": args.lora_r,
            "lora_alpha": args.lora_alpha,
            "lora_dropout": args.lora_dropout,
            "lora_target_modules": LORA_TARGET_MODULES,
            "seed": args.seed,
        },
        "trainable_params": trainable,
        "total_params": total_params,
        "final_train_loss": result.training_loss,
        "first_logged_loss": losses[0] if losses else None,
        "last_logged_loss": losses[-1] if losses else None,
        "eval_metrics": eval_metrics,
        "loss_curve": [
            {"step": entry["step"], "loss": entry["loss"]}
            for entry in trainer.state.log_history
            if "loss" in entry
        ],
        "versions": {
            "python": platform.python_version(),
            "platform": platform.platform(),
            "torch": torch.__version__,
            "unsloth": getattr(unsloth, "__version__", "unknown"),
        },
    }
    summary_path = args.output_dir / "training_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"  summary -> {summary_path}")

    print("\n" + "=" * 78)
    print(f"Peak VRAM: {peak_overall / GB:.3f} GB / budget {args.vram_budget_gb} GB")
    if peak_overall / GB > args.vram_budget_gb:
        print("RESULT: FAIL — over the VRAM budget.", file=sys.stderr)
        print("=" * 78)
        return 1
    headroom = args.vram_budget_gb - peak_overall / GB
    print(f"RESULT: PASS — {headroom:.3f} GB under budget.")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())
