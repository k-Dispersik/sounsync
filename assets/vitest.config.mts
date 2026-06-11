import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        // Same alias esbuild uses, so imports like "js/shared/types" resolve.
        alias: {
            js: fileURLToPath(new URL("./js", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./js/test/setup.ts"],
        include: ["js/**/*.test.{ts,tsx}"],
        restoreMocks: true,
    },
});
