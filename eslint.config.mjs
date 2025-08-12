import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import css from "@eslint/css";

export default tseslint.config([
    { ignores: ["dist", "lib", "react-demo"] },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: [js.configs.recommended],
        languageOptions: { globals: globals.browser },
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.css"],
        plugins: { css },
        language: "css/css",
        extends: [css.configs.recommended],
        rules: {
            "css/use-baseline": ["error", { available: "newly" }],
        },
    },
]);
