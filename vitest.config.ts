import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { "@": path.resolve(__dirname, "src") },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        env: {
            NEXT_PUBLIC_SUPABASE_URL: "https://placeholder-project.supabase.co",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
        },
        include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/integration/**/*.test.{ts,tsx}",
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/icons.tsx", "src/**/*.d.ts"],
            thresholds: {
                'src/lib/**': {
                    statements: 50,
                    branches: 50,
                    functions: 50,
                    lines: 50,
                },
                'src/app/api/**': {
                    statements: 50,
                    branches: 50,
                    functions: 50,
                    lines: 50,
                },
            },
        },
    },
});