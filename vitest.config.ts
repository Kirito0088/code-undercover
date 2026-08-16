import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    test: {
        setupFiles: ["./vitest.setup.ts"],
        // Glob form (**/x/**), not bare directory names — a bare name only
        // matches a top-level entry, so nested paths slip through.
        // .venv: T8's Python training venv (scripts/ml/.venv) vendors JS
        // packages that ship their own *.test.ts files — 300+ of them, all
        // collected as repo tests and all failing, without this.
        exclude: ["**/node_modules/**", "**/.next/**", "**/MyProject/**", "**/.venv/**"],
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    environment: "node",
                    include: ["**/*.test.ts"],
                },
            },
            {
                extends: true,
                test: {
                    name: "component",
                    environment: "jsdom",
                    include: ["**/*.test.tsx"],
                },
            },
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["lib/**", "app/**", "components/**"],
            exclude: ["lib/validation/missionValidator.ts"],
        },
    },
})
