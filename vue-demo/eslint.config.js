import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
    globalIgnores(["dist"]),
    ...pluginVue.configs["flat/recommended"],
    {
        files: ["**/*.ts"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
            globals: globals.browser,
        },
    },
    {
        files: ["**/*.vue"],
        languageOptions: {
            parser: pluginVue.parser,
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 2020,
                sourceType: "module",
            },
            globals: globals.browser,
        },
    },
]);
