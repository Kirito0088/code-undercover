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
        exclude: ["node_modules", ".next", ".opencode/**", "MyProject"],
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
