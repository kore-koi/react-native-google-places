// @ts-check

import { fileURLToPath } from "node:url"

import eslint from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  globalIgnores([
    "dist",
    "node_modules",
    "src/lib/types/openapi.ts",
    "src/api",
    "scripts",
    "plugins",
    "tailwind.config.js",
    "eslint.config.mjs",
    "metro.config.js",
    "app.config.ts",
    "babel.config.js",
    "react-native.config.js",
    "lib",
    "plugin",
    "app.plugin.js"
  ]),
  {
    plugins: {
      "@stylistic": stylistic,
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: 'readonly',
        atob: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly',
      },
    },
    settings: {
    },
    rules: {
      curly: ["error"],
      eqeqeq: ["warn", "always"],
      "no-control-regex": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-new-symbol": "error",
      "no-undef": ["error"],
      "object-shorthand": "error",
      "prefer-const": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
        },
      ],
      "@typescript-eslint/class-literal-property-style": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/arrow-spacing": [
        "error",
        {
          before: true,
          after: true,
        },
      ],
      "@stylistic/brace-style": [
        "error",
        "1tbs",
        {
          allowSingleLine: false,
        },
      ],
      "@stylistic/comma-dangle": [
        "error",
        "always-multiline",
      ],
      "@stylistic/comma-spacing": [
        "error",
        {
          before: false,
          after: true,
        },
      ],
      "@stylistic/computed-property-spacing": ["error", "never"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/key-spacing": [
        "error",
        {
          beforeColon: false,
          afterColon: true,
          mode: "strict",
        },
      ],
      "@stylistic/keyword-spacing": [
        "error",
        {
          before: true,
          after: true,
        },
      ],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/new-parens": ["error", "always"],
      "@stylistic/no-floating-decimal": "error",
      "@stylistic/no-multi-spaces": "error",      "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/no-whitespace-before-property": "error",
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/quotes": [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],
      "@stylistic/rest-spread-spacing": ["error", "never"],
      "@stylistic/semi": ["error", "never"],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-before-function-paren": [
        "error",
        {
          anonymous: "never",
          named: "never",
          asyncArrow: "never",
          catch: "always",
        },
      ],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/space-unary-ops": [
        "error",
        {
          words: true,
          nonwords: false,
        },
      ],
      "@stylistic/spaced-comment": [
        "error",
        "always",
        {
          markers: ["/"],
        },
      ],
      "@stylistic/switch-colon-spacing": [
        "error",
        {
          after: true,
          before: false,
        },
      ],
      "@stylistic/template-curly-spacing": ["error", "never"],
      "@stylistic/template-tag-spacing": ["error", "never"],
      "@stylistic/wrap-iife": ["error", "inside"],
      "@stylistic/member-delimiter-style": [
        "error",
        {
          multiline: {
            delimiter: "none",
            requireLast: false,
          },
          singleline: {
            delimiter: "comma",
            requireLast: false,
          },
        },
      ],
      "@stylistic/type-annotation-spacing": "error",
      "@stylistic/jsx-quotes": ["error", "prefer-double"],
      "@stylistic/jsx-closing-bracket-location": ["error", "line-aligned"],
      "@stylistic/jsx-curly-brace-presence": [
        "error",
        {
          props: "always",
          children: "never",
          propElementValues: "always",
        },
      ],
      "@stylistic/jsx-curly-spacing": [
        "error",
        {
          when: "never",
          children: true,
        },
      ],
      "@stylistic/jsx-equals-spacing": ["error", "never"],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/jsx-pascal-case": "error",
      "@stylistic/jsx-self-closing-comp": [
        "error",
        {
          component: true,
          html: true,
        },
      ],
      "@stylistic/jsx-tag-spacing": [
        "error",
        {
          closingSlash: "never",
          beforeSelfClosing: "never",
          afterOpening: "never",
          beforeClosing: "never",
        },
      ],
      "@typescript-eslint/no-require-imports": "off"
    },
  }
)
