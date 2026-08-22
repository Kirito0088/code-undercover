import { describe, it, expect } from "vitest"
import {
    clearanceFromCounts,
    emptyClearanceProgress,
    TIER_ORDER,
    type ClearanceTier,
} from "./clearance"

const counts = (
    Beginner: number,
    Intermediate: number,
    Pro: number
): Record<ClearanceTier, number> => ({ Beginner, Intermediate, Pro })

describe("clearance ladder", () => {
    it("carries twenty cases per tier", () => {
        const progress = emptyClearanceProgress()
        for (const tier of TIER_ORDER) {
            expect(progress[tier].total).toBe(20)
        }
    })

    it("opens only Panda's board to someone who has cleared nothing", () => {
        const progress = emptyClearanceProgress()

        expect(progress.Beginner.unlocked).toBe(true)
        expect(progress.Intermediate.unlocked).toBe(false)
        expect(progress.Pro.unlocked).toBe(false)
    })

    it("keeps Fox sealed until the very last Panda case is cleared", () => {
        expect(clearanceFromCounts(counts(19, 0, 0)).Intermediate.unlocked).toBe(false)
        expect(clearanceFromCounts(counts(20, 0, 0)).Intermediate.unlocked).toBe(true)
    })

    it("keeps Platypus sealed while Fox is still in progress", () => {
        const progress = clearanceFromCounts(counts(20, 19, 0))

        expect(progress.Intermediate.unlocked).toBe(true)
        expect(progress.Pro.unlocked).toBe(false)
    })

    it("opens Platypus once every Fox case is cleared", () => {
        const progress = clearanceFromCounts(counts(20, 20, 0))

        expect(progress.Beginner.unlocked).toBe(true)
        expect(progress.Intermediate.unlocked).toBe(true)
        expect(progress.Pro.unlocked).toBe(true)
    })

    it("names the tier that holds each locked board shut", () => {
        const progress = emptyClearanceProgress()

        expect(progress.Beginner.requires).toBeUndefined()
        expect(progress.Intermediate.requires).toBe("Beginner")
        expect(progress.Pro.requires).toBe("Intermediate")
    })

    it("reports the prerequisite's own progress, which is what the card shows", () => {
        const progress = clearanceFromCounts(counts(12, 0, 0))

        expect(progress.Beginner.completed).toBe(12)
        expect(progress.Intermediate.unlocked).toBe(false)
    })
})
