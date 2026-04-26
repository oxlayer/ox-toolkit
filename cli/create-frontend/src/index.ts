#!/usr/bin/env node
/**
 * @oxlayer/create-frontend
 *
 * Scaffolding tool for OxLayer frontend apps with React, Vite, and Tailwind CSS v4.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

interface CreateOptions {
  defaults?: boolean;
  template?: string;
}

/**
 * Available templates
 */
const TEMPLATES = [
  {
    value: 'base',
    title: 'Base (Weather App)',
    description: 'Simple weather app with API fetching - no auth',
  },
  {
    value: 'auth',
    title: 'Auth App',
    description: 'Keycloak + React Query + Axios + Tailwind - full auth setup',
  },
] as const;

type TemplateValue = (typeof TEMPLATES)[number]['value'];

interface TemplateVars {
  PROJECT_NAME: string;
  PROJECT_SLUG: string;
  PROJECT_DESCRIPTION: string;
  PROJECT_AUTHOR: string;
  PORT: string;
}

const program = new Command();

program
  .name('create-frontend')
  .description('Scaffold a new OxLayer frontend app with React and Vite')
  .version(packageJson.version)
  .argument('[project-name]', 'Name of the project')
  .option('-d, --defaults', 'Use default options')
  .option('-t, --template <name>', 'Template to use (base, auth)')
  .action(async (projectName: string | undefined, options) => {
    try {
      await createFrontend(projectName, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

async function createFrontend(projectName: string | undefined, options: CreateOptions) {
  console.log();
  console.log(chalk.cyan.bold('╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           OxLayer Frontend App Generator             ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════╝'));
  console.log();

  // Get template selection
  let template: TemplateValue = 'base';
  if (options.template) {
    template = options.template as TemplateValue;
    if (!TEMPLATES.find(t => t.value === template)) {
      console.error(chalk.red(`Invalid template: ${options.template}`));
      console.error(chalk.yellow('Available templates:'), TEMPLATES.map(t => t.value).join(', '));
      process.exit(1);
    }
  } else if (options.defaults) {
    template = 'base';
  } else {
    const response = await prompts({
      type: 'select',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: TEMPLATES.map(t => ({ title: t.title, description: t.description, value: t.value })),
      initial: 0,
    });
    template = response.template as TemplateValue;
  }

  console.log(chalk.dim(`Template: ${TEMPLATES.find(t => t.value === template)?.title}`));
  console.log();

  // Get project name
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'What is your project name?',
      initial: 'my-app',
      validate: (value: string) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Use lowercase letters, numbers, and hyphens only';
        }
        return true;
      },
    });
    projectName = response.name;
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${projectName}" exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log(chalk.yellow('Cancelled.'));
      process.exit(0);
    }
    await fs.remove(targetDir);
  }

  // Collect configuration
  let vars: TemplateVars;

  if (options.defaults) {
    vars = getTemplateVars(projectName, template);
  } else {
    vars = await promptForVars(projectName, template);
  }

  // Create project
  const spinner = ora('Creating project...').start();

  try {
    // Create template structure
    await copyTemplate(targetDir, vars, template);
    spinner.succeed('Project created');

    // Show next steps
    showNextSteps(projectName, vars, template);
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

function getTemplateVars(projectName: string, template: TemplateValue): TemplateVars {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: template === 'auth'
      ? `${toTitleCase(slug)} with Keycloak authentication`
      : `A new OxLayer frontend app`,
    PROJECT_AUTHOR: '',
    PORT: template === 'auth' ? '5174' : '5173',
  };
}

async function promptForVars(projectName: string, template: TemplateValue): Promise<TemplateVars> {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const response = await prompts([
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: template === 'auth'
        ? `${toTitleCase(slug)} with Keycloak authentication`
        : `A new OxLayer frontend app`,
    },
    {
      type: 'text',
      name: 'author',
      message: 'Author:',
      initial: '',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Dev Server Port:',
      initial: template === 'auth' ? 5174 : 5173,
    },
  ]);

  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: response.description,
    PROJECT_AUTHOR: response.author,
    PORT: String(response.port),
  };
}

async function copyTemplate(targetDir: string, vars: TemplateVars, template: TemplateValue) {
  const templateDir = path.join(__dirname, '../templates', template);

  // Check if template exists
  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template "${template}" not found at ${templateDir}`);
  }

  // Copy and process all template files
  await processDirectory(templateDir, targetDir, vars);

  // Rename _package.json to package.json
  const packageJsonPath = path.join(targetDir, '_package.json');
  const newPackageJsonPath = path.join(targetDir, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    await fs.move(packageJsonPath, newPackageJsonPath);
  }
}

async function processDirectory(
  sourceDir: string,
  targetDir: string,
  vars: TemplateVars
) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await fs.ensureDir(targetPath);
      await processDirectory(sourcePath, targetPath, vars);
    } else {
      // Read file content
      let content = await fs.readFile(sourcePath, 'utf-8');

      // Replace template variables
      content = content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const varName = key as keyof TemplateVars;
        return vars[varName] || '';
      });

      // Write processed file
      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, content);
    }
  }
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function showNextSteps(projectName: string, vars: TemplateVars, template: TemplateValue) {
  const templateInfo = TEMPLATES.find(t => t.value === template);

  console.log();
  console.log(chalk.green.bold('✨ Project created successfully!'));
  console.log();
  console.log(chalk.cyan('Template:'), chalk.white(templateInfo?.title));
  console.log();
  console.log(chalk.cyan('Next steps:'));
  console.log();
  console.log(chalk.white('  cd'), chalk.yellow(projectName));
  console.log(chalk.white('  pnpm install'));
  console.log(chalk.white('  pnpm dev'));
  console.log();
  console.log(chalk.cyan('Available commands:'));
  console.log(chalk.white('  pnpm dev'), '     - Start dev server');
  console.log(chalk.white('  pnpm build'), '   - Build for production');
  console.log(chalk.white('  pnpm preview'), ' - Preview production build');
  console.log(chalk.white('  pnpm lint'), '    - Run ESLint');
  console.log();
  console.log(chalk.cyan('Dev server:'));
  console.log(chalk.white(`  http://localhost:${vars.PORT}`));
  console.log();
}
