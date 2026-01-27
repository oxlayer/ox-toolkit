import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: true,
  target: "es2022",
  external: ["@oxlayer/snippets", "hono"],
});
