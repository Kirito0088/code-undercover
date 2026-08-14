import { describe, it, expect } from "vitest"
import {
    normalizeErrorMessage,
    normalizeLineContent,
    computeErrorHash,
} from "./errorHash"

describe("computeErrorHash", () => {
    it("is deterministic — same inputs produce the same hash across calls", () => {
        const a = computeErrorHash("expected ';' before '}' token", "int x = 5")
        const b = computeErrorHash("expected ';' before '}' token", "int x = 5")
        expect(a).toBe(b)
    })

    it("is whitespace-insensitive in the broken line", () => {
        const a = computeErrorHash("some error", 'int x = "hi";')
        const b = computeErrorHash("some error", 'int   x  =  "hi" ;')
        expect(a).toBe(b)
    })

    it("is insensitive to trailing line comments", () => {
        const a = computeErrorHash("some error", 'int x = "hi";')
        const b = computeErrorHash("some error", 'int x = "hi"; // my note')
        expect(a).toBe(b)
    })

    it("generalizes non-keyword identifiers to the same hash", () => {
        const a = computeErrorHash("some error", 'int x = "hello";')
        const b = computeErrorHash("some error", 'int count = "abc";')
        expect(a).toBe(b)
    })

    it("preserves keywords, so different keywords produce different hashes", () => {
        const a = computeErrorHash("some error", 'int x = "a";')
        const b = computeErrorHash("some error", 'char x = "a";')
        expect(a).not.toBe(b)
    })

    it("strips file path prefixes so only the message content matters", () => {
        const a = computeErrorHash("/box/script.c:4:9: error: foo", "int x")
        const b = computeErrorHash("/tmp/x.c:9:2: error: foo", "int x")
        expect(a).toBe(b)
    })

    it("keeps the two fields separated so boundary shifts don't collide", () => {
        expect(computeErrorHash("ab", "c")).not.toBe(computeErrorHash("a", "bc"))
    })

    it("returns a lowercase 64-char hex SHA-256 digest", () => {
        const hash = computeErrorHash("some error", "int x = 5")
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
})

describe("normalizeErrorMessage", () => {
    it("lowercases the message", () => {
        expect(normalizeErrorMessage("Unknown Type Name 'Foo'")).toBe(
            "unknown type name '<id>'"
        )
    })

    it("collapses whitespace runs and trims", () => {
        expect(normalizeErrorMessage("  error:   too   many   spaces  ")).toBe(
            "error: too many spaces"
        )
    })

    it("strips an absolute file path prefix", () => {
        expect(normalizeErrorMessage("/box/script.c:4:9: error: foo")).toBe(
            "error: foo"
        )
    })

    it("strips a different absolute file path prefix identically", () => {
        expect(normalizeErrorMessage("/tmp/x.c:9:2: error: foo")).toBe(
            "error: foo"
        )
    })

    it("replaces quoted identifiers with a placeholder", () => {
        expect(normalizeErrorMessage("unknown type name 'foo'")).toBe(
            "unknown type name '<id>'"
        )
        expect(normalizeErrorMessage("unknown type name 'bar'")).toBe(
            "unknown type name '<id>'"
        )
    })
})

describe("normalizeLineContent", () => {
    it("collapses whitespace runs and trims", () => {
        expect(normalizeLineContent('int   x  =  "hi" ;')).toBe(
            normalizeLineContent('int x = "hi";')
        )
    })

    it("strips trailing line comments", () => {
        expect(normalizeLineContent('int x = "hi"; // my note')).toBe(
            normalizeLineContent('int x = "hi";')
        )
    })

    it("strips inline block comments", () => {
        expect(normalizeLineContent('int x /* comment */ = "hi";')).toBe(
            normalizeLineContent('int x = "hi";')
        )
    })

    it("replaces string literals with a placeholder", () => {
        expect(normalizeLineContent('int x = "hello";')).toBe(
            'int <id> = "<str>";'
        )
    })

    it("replaces numeric literals with a placeholder", () => {
        expect(normalizeLineContent("int x = 42;")).toBe("int <id> = <num>;")
    })

    it("generalizes non-keyword identifiers", () => {
        expect(normalizeLineContent('int x = "hello";')).toBe(
            normalizeLineContent('int count = "abc";')
        )
    })

    it("preserves C keywords instead of generalizing them", () => {
        expect(normalizeLineContent('int x = "a";')).not.toBe(
            normalizeLineContent('char x = "a";')
        )
        expect(normalizeLineContent("int x = 5;")).toContain("int")
    })
})
