#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");
var import_chalk = __toESM(require("chalk"), 1);
var import_prompts = __toESM(require("prompts"), 1);
var import_ora = __toESM(require("ora"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs_extra = __toESM(require("fs-extra"), 1);
var packageJson = JSON.parse(
  import_fs_extra.default.readFileSync(import_path.default.join(__dirname, "../package.json"), "utf-8")
);
var TEMPLATES = [
  {
    value: "base",
    title: "Base",
    description: "Minimal React + Vite + Tailwind CSS v4 setup"
  },
  {
    value: "auth",
    title: "Auth",
    description: "Base + Keycloak authentication with SSO"
  },
  {
    value: "dashboard",
    title: "Dashboard",
    description: "Auth + React Router + Layout + TanStack Query"
  }
];
var program = new import_commander.Command();
program.name("create-frontend").description("Scaffold a new OxLayer frontend app with React and Vite").version(packageJson.version).argument("[project-name]", "Name of the project").option("-d, --defaults", "Use default options").option("-t, --template <name>", "Template to use (base, auth, dashboard)").action(async (projectName, options) => {
  try {
    await createFrontend(projectName, options);
  } catch (error) {
    console.error(import_chalk.default.red("Error:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program.parse();
async function createFrontend(projectName, options) {
  console.log();
  console.log(import_chalk.default.cyan.bold("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"));
  console.log(import_chalk.default.cyan.bold("\u2551           OxLayer Frontend App Generator             \u2551"));
  console.log(import_chalk.default.cyan.bold("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"));
  console.log();
  let template = "base";
  if (options.template) {
    template = options.template;
    if (!TEMPLATES.find((t) => t.value === template)) {
      console.error(import_chalk.default.red(`Invalid template: ${options.template}`));
      console.error(import_chalk.default.yellow("Available templates:"), TEMPLATES.map((t) => t.value).join(", "));
      process.exit(1);
    }
  } else if (options.defaults) {
    template = "base";
  } else {
    const response = await (0, import_prompts.default)({
      type: "select",
      name: "template",
      message: "Which template would you like to use?",
      choices: TEMPLATES.map((t) => ({ title: t.title, description: t.description, value: t.value })),
      initial: 0
    });
    template = response.template;
  }
  console.log(import_chalk.default.dim(`Template: ${TEMPLATES.find((t) => t.value === template)?.title}`));
  console.log();
  if (!projectName) {
    const response = await (0, import_prompts.default)({
      type: "text",
      name: "name",
      message: "What is your project name?",
      initial: "my-app",
      validate: (value) => {
        if (!value) return "Project name is required";
        if (!/^[a-z0-9-]+$/.test(value)) {
          return "Use lowercase letters, numbers, and hyphens only";
        }
        return true;
      }
    });
    projectName = response.name;
  }
  const targetDir = import_path.default.resolve(process.cwd(), projectName);
  if (await import_fs_extra.default.pathExists(targetDir)) {
    const { overwrite } = await (0, import_prompts.default)({
      type: "confirm",
      name: "overwrite",
      message: `Directory "${projectName}" exists. Overwrite?`,
      initial: false
    });
    if (!overwrite) {
      console.log(import_chalk.default.yellow("Cancelled."));
      process.exit(0);
    }
    await import_fs_extra.default.remove(targetDir);
  }
  let vars;
  if (options.defaults) {
    vars = getTemplateVars(projectName);
  } else {
    vars = await promptForVars(projectName);
  }
  const spinner = (0, import_ora.default)("Creating project...").start();
  try {
    await copyTemplate(targetDir, vars, template);
    spinner.succeed("Project created");
    showNextSteps(projectName, vars, template);
  } catch (error) {
    spinner.fail("Failed to create project");
    throw error;
  }
}
function getTemplateVars(projectName) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: `A new OxLayer frontend app`,
    PROJECT_AUTHOR: "",
    PORT: "5173"
  };
}
async function promptForVars(projectName) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const response = await (0, import_prompts.default)([
    {
      type: "text",
      name: "description",
      message: "Description:",
      initial: `A new OxLayer frontend app`
    },
    {
      type: "text",
      name: "author",
      message: "Author:",
      initial: ""
    },
    {
      type: "number",
      name: "port",
      message: "Dev Server Port:",
      initial: 5173
    }
  ]);
  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: response.description,
    PROJECT_AUTHOR: response.author,
    PORT: String(response.port)
  };
}
async function copyTemplate(targetDir, vars, template) {
  const templateDir = import_path.default.join(__dirname, "../templates", template);
  if (!await import_fs_extra.default.pathExists(templateDir)) {
    throw new Error(`Template "${template}" not found at ${templateDir}`);
  }
  await processDirectory(templateDir, targetDir, vars);
  const packageJsonPath = import_path.default.join(targetDir, "_package.json");
  const newPackageJsonPath = import_path.default.join(targetDir, "package.json");
  if (await import_fs_extra.default.pathExists(packageJsonPath)) {
    await import_fs_extra.default.move(packageJsonPath, newPackageJsonPath);
  }
}
async function processDirectory(sourceDir, targetDir, vars) {
  const entries = await import_fs_extra.default.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = import_path.default.join(sourceDir, entry.name);
    const targetPath = import_path.default.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await import_fs_extra.default.ensureDir(targetPath);
      await processDirectory(sourcePath, targetPath, vars);
    } else {
      let content = await import_fs_extra.default.readFile(sourcePath, "utf-8");
      content = content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const varName = key;
        return vars[varName] || "";
      });
      await import_fs_extra.default.ensureDir(import_path.default.dirname(targetPath));
      await import_fs_extra.default.writeFile(targetPath, content);
    }
  }
}
function toTitleCase(str) {
  return str.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function showNextSteps(projectName, vars, template) {
  const templateInfo = TEMPLATES.find((t) => t.value === template);
  console.log();
  console.log(import_chalk.default.green.bold("\u2728 Project created successfully!"));
  console.log();
  console.log(import_chalk.default.cyan("Template:"), import_chalk.default.white(templateInfo?.title));
  console.log();
  console.log(import_chalk.default.cyan("Next steps:"));
  console.log();
  console.log(import_chalk.default.white("  cd"), import_chalk.default.yellow(projectName));
  console.log(import_chalk.default.white("  pnpm install"));
  console.log(import_chalk.default.white("  pnpm dev"));
  console.log();
  console.log(import_chalk.default.cyan("Available commands:"));
  console.log(import_chalk.default.white("  pnpm dev"), "     - Start dev server");
  console.log(import_chalk.default.white("  pnpm build"), "   - Build for production");
  console.log(import_chalk.default.white("  pnpm preview"), " - Preview production build");
  console.log(import_chalk.default.white("  pnpm lint"), "    - Run ESLint");
  console.log();
  console.log(import_chalk.default.cyan("Dev server:"));
  console.log(import_chalk.default.white(`  http://localhost:${vars.PORT}`));
  console.log();
}
