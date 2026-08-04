import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        // `next lint` used to apply these implicitly; the standalone ESLint
        // CLI doesn't, so build/generated output gets linted otherwise.
        // scripts/ is excluded to match tsconfig.json — standalone dev/
        // diagnostic scripts, not part of the shipped app.
        ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts", "scripts/**"],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "@next/next/no-img-element": "off",

            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
            }],
        },
    },
];

export default eslintConfig;
