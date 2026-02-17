import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";
import svgr from "vite-plugin-svgr";

// Config file uses ESM (electron-vite supports this), outputs CommonJS for main/preload
const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceInternalPackages = [] as const;

const nodeAliases = {
  "@shared": resolve("src/shared"),
};

// ESM-only packages that need to be bundled (not externalized)
const esmPackagesToBundle = [
  "electron-store", // ESM-only package, must be bundled
  "@oxlayer/cli" // ESM-only package with top-level await
] as const;

// Packages that must be bundled for main process (not externalized)
const manualMainProcessPackagesToBundle = [
  "@electron-toolkit/utils", // Used in main process, must be bundled for ASAR
] as const;

// Preload scripts run in a sandboxed environment
const preloadPackagesToBundle = [
  "@electron-toolkit/preload",
] as const;

// Production build detection
const isProduction = process.env.NODE_ENV === "production";
const shouldGenerateSourcemaps = !isProduction;

// Shared build configuration for main and preload processes
const sharedMainPreloadBuildConfig = {
  externalizeDeps: {
    exclude: [
      ...workspaceInternalPackages,
      ...esmPackagesToBundle,
      ...manualMainProcessPackagesToBundle,
    ] as string[],
  },
  minify: isProduction ? ("terser" as const) : false,
  sourcemap: shouldGenerateSourcemaps,
};

export default defineConfig({
  main: {
    resolve: {
      alias: nodeAliases,
    },
    build: {
      ...sharedMainPreloadBuildConfig,
      commonjsOptions: {
        ignoreDynamicRequires: true,
        // Handle top-level await by transforming it
        transformMixedEsModules: true,
      },
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
        output: {
          format: "es" as const,
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
        },
      },
    },
  },
  preload: {
    resolve: {
      alias: nodeAliases,
    },
    build: {
      ...sharedMainPreloadBuildConfig,
      bytecode: false,
      commonjsOptions: {
        ignoreDynamicRequires: true,
      },
      externalizeDeps: {
        exclude: [
          ...workspaceInternalPackages,
          ...esmPackagesToBundle,
          ...preloadPackagesToBundle,
        ] as string[],
      },
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
        output: {
          format: "cjs" as const,
        },
      },
    },
  },
  renderer: {
    base: "./",
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@": resolve("src/renderer/src"),
        "@shared": resolve("src/shared"),
      },
      conditions: ["browser", "module", "import"],
      dedupe: ["react", "react-dom"],
    },
    build: {
      minify: isProduction ? ("terser" as const) : false,
      sourcemap: shouldGenerateSourcemaps,
      reportCompressedSize: isProduction,
      rollupOptions: {
        external: [/^node:/, /^electron$/],
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
      tailwindcss(),
      svgr({
        svgrOptions: {
          icon: true,
        },
      }),
    ],
  },
});
