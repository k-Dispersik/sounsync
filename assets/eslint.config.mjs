import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

/**
 * Rules are turned on ratchet-style: first whatever the current code already
 * passes, then one rule per commit (see "Next in line" at the bottom).
 */
export default tseslint.config(
    {
        ignores: ["node_modules/**", "vendor/**", "eslint.config.mjs"],
    },

    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,

    {
        files: ["js/**/*.{ts,tsx}"],
        // The plugin is wired up by hand: its v7 presets pull in the whole
        // React Compiler rule set, and only the two classic rules are wanted.
        plugins: { "react-hooks": reactHooks },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",

            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],

            complexity: ["error", 10],
            eqeqeq: ["error", "smart"],
        },
    },

    {
        // Reaching into another feature is allowed only through its public
        // barrel (features/<name>/index.ts). Inside a feature, anything goes.
        files: ["js/**/*.{ts,tsx}"],
        ignores: ["js/features/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/features/*/*", "**/features/*/*/**"],
                            message:
                                "Import through the features/<name> barrel, not into the feature.",
                        },
                    ],
                },
            ],
        },
    },

    /*
     * Next in line, switched on once the code passes them:
     *   no-console, with a dedicated logger module as the only exception
     *   max-lines: 150 for a component, 80 for a hook
     *   no-restricted-syntax: raw colors, tailwind palette classes,
     *     daisyUI classes outside shared/ui
     */

    prettierConfig,
);
