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

            "no-console": "error",

            "no-restricted-syntax": [
                "error",
                {
                    // A colour written into a component cannot be themed, and
                    // will not follow when the palette changes.
                    selector:
                        "Literal[value=/(^|\\s)(bg|text|border|ring|fill|stroke)-(cyan|red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|sky|indigo|violet|fuchsia|rose)-[0-9]/]",
                    message: "Use a token from css/tokens.css instead of a palette colour.",
                },
                {
                    selector: "Literal[value=/(^|\\s)(text|bg)-(white|black)(\\/|\\s|$)/]",
                    message: "Use a text or surface token instead of white or black.",
                },
                {
                    selector: "Literal[value=/#[0-9a-fA-F]{6}\\b|rgba?\\(/]",
                    message: "Use a token from css/tokens.css instead of a literal colour.",
                },
                {
                    // daisyUI component classes bring their own look and their
                    // own accessibility decisions; ours live in shared/ui.
                    selector:
                        "Literal[value=/(^|\\s)(btn|modal-box|modal-action|modal-backdrop|dropdown|dropdown-content|badge|menu|skeleton|navbar|tabs)(\\s|$)/]",
                    message: "Use a component from @/shared/ui instead of a daisyUI class.",
                },
            ],

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
                            group: [
                                "@/features/*/*",
                                "@/features/*/*/**",
                                "**/features/*/*",
                                "**/features/*/*/**",
                            ],
                            message:
                                "Import through the @/features/<name> barrel, not into the feature.",
                        },
                    ],
                },
            ],
        },
    },

    {
        // The one module that is allowed to call console directly.
        files: ["js/shared/lib/logger.ts"],
        rules: { "no-console": "off" },
    },

    {
        // Tests ship no styles, and the class-name patterns match ordinary
        // English inside test names often enough to be a nuisance there.
        files: ["js/**/*.test.{ts,tsx}"],
        rules: { "no-restricted-syntax": "off" },
    },

    /*
     * Next in line, switched on once the code passes it:
     *   max-lines: 150 for a component, 80 for a hook
     */

    prettierConfig,
);
