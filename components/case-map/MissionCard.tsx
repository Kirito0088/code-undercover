"use client";

import styles from "../levels/MissionBoard.module.css";

export type MissionState = "cleared" | "active" | "locked";

export interface MissionCardProps {
  index: number;
  title: string;
  state: MissionState;
  x: number;
  y: number;
  tilt: number;
  delay: string;
  isSelected?: boolean;
  isShaking?: boolean;
  pinRef?: (el: HTMLSpanElement | null) => void;
  folderRef?: (el: HTMLButtonElement | null) => void;
  onOpen?: () => void;
  onHover?: (on: boolean) => void;
  onSelect?: () => void;
}

function TickIcon() {
  return (
    <svg className={styles.folderTick} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13l5.5 5.5L20 5.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className={styles.folderLock} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx={2} fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" />
    </svg>
  );
}

export function MissionCard({
  index,
  title,
  state,
  x,
  y,
  tilt,
  delay,
  isSelected,
  isShaking,
  pinRef,
  folderRef,
  onOpen,
  onHover,
  onSelect,
}: MissionCardProps) {
  const num = String(index).padStart(2, "0");
  const isLocked = state === "locked";
  const isDone = state === "cleared";
  const isCurrent = state === "active";
  const label = isDone ? "Cleared" : isCurrent ? "In progress" : "Locked";
  const tipBelow = y < 26;

  const handleClick = () => {
    if (isLocked) {
      // shake handled via parent isShaking prop, but also trigger via onSelect for shake
      onSelect?.();
      return;
    }
    onSelect?.();
    onOpen?.();
  };

  const className = [
    styles.folder,
    isDone ? styles.folderDone : "",
    isCurrent ? styles.folderCurrent : "",
    isLocked ? styles.folderLocked : "",
    isSelected ? styles.folderSelected : "",
    isShaking ? styles.isShaking : "",
    tipBelow ? styles.folderTipBelow : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={folderRef}
      type="button"
      className={className}
      data-level={String(index)}
      data-state={state}
      style={
        {
          "--x": `${x}%`,
          "--y": `${y}%`,
          "--tilt": `${tilt}deg`,
          "--delay": delay,
        } as React.CSSProperties
      }
      aria-disabled={isLocked ? "true" : undefined}
      aria-label={`Mission ${num}, ${title}. ${label}.`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      disabled={false}
    >
      <span ref={pinRef} className={styles.folderPin} aria-hidden="true" />
      <span className={styles.folderTab} aria-hidden="true" />
      <span className={styles.folderSheet} aria-hidden="true" />
      <span className={styles.folderBody}>
        <span className={styles.folderNum}>{num}</span>
        <span className={styles.folderName}>{title}</span>
        <span className={styles.folderState}>{label.toUpperCase()}</span>
        {isDone && <TickIcon />}
        {isLocked && (
          <>
            <LockIcon />
            <span className={styles.folderSeal} aria-hidden="true">
              LEVEL LOCKED
            </span>
          </>
        )}
      </span>
      <span className={styles.folderTip}>
        Mission {num} — {title}
      </span>
    </button>
  );
}
