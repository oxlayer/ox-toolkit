import { type Options as TsupConfigOptions, defineConfig } from "tsup";

const baseConfig = {
  format: ["esm"],
  splitting: false,
  sourcemap: false,
  clean: true,
  target: "es2022",
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
  entry: ["src/index.ts", "bin/index.ts", "src/templates/index.ts"],
});
