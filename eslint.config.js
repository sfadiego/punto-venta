import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import('eslint').Linter.Config[]} */
export default [
    // 1. Ignorar carpetas primero
    {
        ignores: [
            "vendor/**",
            "node_modules/**",
            "public/**",
            "bootstrap/ssr/**",
            "tailwind.config.js",
            "scripts/**",
        ],
    },
    // 2. Configuración base para JS y TS
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,

    // 3. Configuración de React
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        ...pluginReact.configs.flat.recommended, // Cargamos la recomendada de React
        languageOptions: {
            ...pluginReact.configs.flat.recommended.languageOptions,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        plugins: {
            "react-hooks": pluginReactHooks,
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["error", {
                varsIgnorePattern: "^_",
                argsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
                destructuredArrayIgnorePattern: "^_",
            }],
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // ── Reglas CLAUDE.md ────────────────────────────────────────────

            // No usar bootstrap-icons ni zustand
            "no-restricted-imports": ["error", {
                patterns: [
                    {
                        group: ["bootstrap-icons", "react-bootstrap-icons"],
                        message: "Usa lucide-react para iconos (CLAUDE.md: Iconos).",
                    },
                ],
                paths: [
                    {
                        name: "zustand",
                        message: "No uses Zustand. Usa TanStack Query para estado del servidor (CLAUDE.md: Servicios).",
                    },
                ],
            }],

            // No usar <table> HTML — usar DataTable
            "no-restricted-syntax": [
                "error",
                {
                    selector: "JSXOpeningElement[name.name='table']",
                    message: "Usa el componente DataTable en lugar de <table> HTML (CLAUDE.md: Componentes).",
                },
                {
                    selector: "JSXOpeningElement[name.name='thead']",
                    message: "Usa el componente DataTable en lugar de <thead> HTML (CLAUDE.md: Componentes).",
                },
                {
                    selector: "JSXOpeningElement[name.name='tbody']",
                    message: "Usa el componente DataTable en lugar de <tbody> HTML (CLAUDE.md: Componentes).",
                },
                {
                    selector: "JSXOpeningElement[name.name='tr']",
                    message: "Usa el componente DataTable en lugar de <tr> HTML (CLAUDE.md: Componentes).",
                },
                {
                    selector: "JSXOpeningElement[name.name='td']",
                    message: "Usa el componente DataTable en lugar de <td> HTML (CLAUDE.md: Componentes).",
                },
                {
                    selector: "JSXOpeningElement[name.name='th']",
                    message: "Usa el componente DataTable en lugar de <th> HTML (CLAUDE.md: Componentes).",
                },
            ],
        },
    },

    // ── Excepción: axiosConfig puede importar axios directamente ───────────
    {
        files: ["resources/js/configs/axiosConfig.ts"],
        rules: {
            "no-restricted-imports": "off",
        },
    },
    // 4. Prettier siempre al final para desactivar reglas de formato
    prettier,
    {
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            "no-unused-vars": "off", // Desactivamos la regla base para que no choque
            "unused-imports/no-unused-imports": "error", // Esta es la que borra al hacer --fix
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];
