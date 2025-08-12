import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        exclude: ["react-demo", "node_modules"],
    },
});
