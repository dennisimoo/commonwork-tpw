import globals from "globals";
import react from "eslint-plugin-react";
export default [
  { ignores: ["node_modules/**", "build/**", "dist/**"] },
  {
    files: ["src/**/*.{jsx,js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    plugins: { react },
    settings: { react: { version: "detect" } },
    rules: { "no-undef": "error", "react/jsx-no-undef": "error" },
  },
];
