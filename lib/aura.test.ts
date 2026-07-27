import { describe, it, expect } from "vitest"
import { calculateAuraLevel, calculateAgentRank } from "./aura"

describe("calculateAuraLevel", () => {
    it("floors negative points to level 1", () => {
        expect(calculateAuraLevel(-100)).toBe(1)
    })

    it.each([
        [0, 1],
        [199, 1],
        [200, 2],
        [499, 2],
        [500, 3],
        [999, 3],
        [1000, 4],
        [1999, 4],
        [2000, 5],
        [3499, 5],
    ])("maps %i aura points to level %i", (points, level) => {
        expect(calculateAuraLevel(points)).toBe(level)
    })

    it("keeps extrapolating for very high point totals without throwing", () => {
        const level = calculateAuraLevel(50000)
        expect(level).toBeGreaterThan(5)
        expect(Number.isFinite(level)).toBe(true)
    })

    it("is monotonically non-decreasing as points increase", () => {
        let prevLevel = calculateAuraLevel(0)
        for (let points = 0; points <= 10000; points += 137) {
            const level = calculateAuraLevel(points)
            expect(level).toBeGreaterThanOrEqual(prevLevel)
            prevLevel = level
        }
    })
})

describe("calculateAgentRank", () => {
    it.each([
        [0, "Panda"],
        [49, "Panda"],
        [50, "Owl"],
        [149, "Owl"],
        [150, "Raccoon"],
        [2500, "Platypus"],
        [10000, "Platypus"],
    ])("maps %i aura points to rank %s", (points, rank) => {
        expect(calculateAgentRank(points)).toBe(rank)
    })
})
