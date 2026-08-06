import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        // Same alias esbuild and tsconfig use, so "@/shared/types" resolves.
        alias: {
            "@": fileURLToPath(new URL("./js", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./js/test/setup.ts"],
        include: ["js/**/*.test.{ts,tsx}"],
        // Each test starts with a clean slate: call counts leaking between
        // tests make "was this called once?" quietly meaningless.
        clearMocks: true,
        restoreMocks: true,
    },
});
