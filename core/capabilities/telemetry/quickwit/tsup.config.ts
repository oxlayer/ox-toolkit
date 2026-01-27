import { type Options as TsupConfigOptions, defineConfig } from "tsup";

const baseConfig = {
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: true,
  clean: false,
  target: "es2022",
  minify: false,
  dts: process.env.CI ? false : true,
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
