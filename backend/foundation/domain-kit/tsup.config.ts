import { type Options as TsupConfigOptions, defineConfig } from "tsup";

const baseConfig = {
  format: ["cjs", "esm"],
  splitting: false,
  clean: false,
  target: "es2022",
  sourcemap: false,
  minify: true,
  dts: true,
  esbuildOptions(options) {
    options.keepNames = true;
    return options;
  },
} satisfies TsupConfigOptions;

export default defineConfig({
  ...baseConfig,
  outDir: "dist",
  entry: ["src/index.ts"],
});
