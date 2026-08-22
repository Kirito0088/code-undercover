"use client";

import { Check, Lock } from "lucide-react";
import styles from "./MissionCard.module.css";

export type MissionState = "cleared" | "active" | "locked";

export interface MissionCardProps {
  index: number;
  title: string;
  state: MissionState;
  onOpen?: () => void;
  pinRef?: (el: HTMLSpanElement | null) => void;
  style?: React.CSSProperties;
}

export function MissionCard({ index, title, state, onOpen, pinRef, style }: MissionCardProps) {
  const isLocked = state === "locked";
  return (
    <button
      type="button"
      className={styles.card}
      data-state={state}
      style={style}
      onClick={isLocked ? undefined : onOpen}
      disabled={isLocked}
      aria-label={`Mission ${index}: ${title} — ${state}`}
    >
      <span className={styles.folderTab} aria-hidden />
      <span ref={pinRef} className={styles.pin} aria-hidden />

      <div className={styles.head}>
        <span className={styles.num}>{String(index).padStart(2, "0")}</span>
        <span className={styles.mark}>
          {state === "cleared" ? <Check size={14} strokeWidth={3} /> : isLocked ? <Lock size={12} /> : null}
        </span>
      </div>

      <div className={styles.title}>{title}</div>

      <div className={styles.status}>
        {state === "cleared" ? "✓ CLEARED" : state === "active" ? "IN PROGRESS" : "LEVEL LOCKED"}
      </div>
    </button>
  );
}
