import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/main.tsx"],
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core + router
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    // HTTP + estado servidor
                    "vendor-data": ["axios", "@tanstack/react-query"],
                    // UI components
                    "vendor-mantine": ["@mantine/core", "mantine-datatable"],
                    // Formularios + notificaciones
                    "vendor-app": ["formik", "yup", "sweetalert2", "react-toastify"],
                    // lucide-react NO va aquí a propósito: forzar todo el paquete a un
                    // chunk fijo rompe el code-splitting de DynamicIcon.tsx (que carga
                    // íconos individuales vía import() dinámico) — Rollup ya agrupa por
                    // su cuenta los íconos importados de forma estática.
                },
            },
        },
    },
    server: {
        host: "localhost",
        port: 5173,
        hmr: {
            host: "localhost",
        },
    },
    define: {
        global: "globalThis",
    },
    resolve: {
        alias: {
            "@/": path.resolve(__dirname, "resources/js") + "/",
            "@css": "/resources/css",
            "@assets": path.resolve(__dirname, "resources/assets"),
            "@components": "/resources/js/components",
            "@resources": "/resources/js",
            "@hooks": "/resources/js/hooks",
        },
    },
});
