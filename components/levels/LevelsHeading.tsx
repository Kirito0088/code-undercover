import { kalam } from "@/lib/detective-fonts"
import { TRACKS } from "@/app/levels/curriculum"
import styles from "./LevelsHeading.module.css"

const TRACK_BY_PATH: Record<"Beginner" | "Intermediate" | "Expert", "ALPHA" | "BETA" | "GAMMA"> = {
    Beginner: "ALPHA",
    Intermediate: "BETA",
    Expert: "GAMMA",
}

const TAG_COLOR: Record<"Beginner" | "Intermediate" | "Expert", string> = {
    Beginner: "linear-gradient(180deg, #a5453a, #7a2e28)",
    Intermediate: "linear-gradient(180deg, #6d8f6f, #46664a)",
    Expert: "linear-gradient(180deg, #6b7a9e, #3d4a6b)",
}

interface LevelsHeadingProps {
    activePath: "Beginner" | "Intermediate" | "Expert"
}

export function LevelsHeading({ activePath }: LevelsHeadingProps) {
    const track = TRACKS[TRACK_BY_PATH[activePath]]

    return (
        <header className={`${styles.head} ${kalam.variable}`}>
            <span className={styles.tag} style={{ background: TAG_COLOR[activePath] }}>
                {track.clearance}
            </span>
            <h1 className={styles.title}>
                {track.name} <span className={styles.accent}>Case Files</span>
            </h1>
            <span className={styles.rule} aria-hidden="true" />
        </header>
    )
}
