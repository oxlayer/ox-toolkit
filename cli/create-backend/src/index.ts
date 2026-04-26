#!/usr/bin/env node
/**
 * @oxlayer/create-backend
 *
 * Scaffolding tool for OxLayer backend APIs with full observability stack.
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
    title: 'Base',
    description: 'Standard backend with PostgreSQL, Redis, RabbitMQ, and observability',
  },
  {
    value: 'tenancy',
    title: 'Tenancy',
    description: 'Multi-tenant backend with tenant isolation and per-tenant databases',
  },
] as const;

type TemplateValue = (typeof TEMPLATES)[number]['value'];

interface TemplateVars {
  PROJECT_NAME: string;
  PROJECT_SLUG: string;
  PROJECT_DESCRIPTION: string;
  PROJECT_AUTHOR: string;
  PORT: string;
  DB_NAME: string;
}

const program = new Command();

program
  .name('create-backend')
  .description('Scaffold a new OxLayer backend API with observability')
  .version(packageJson.version)
  .argument('[project-name]', 'Name of the project')
  .option('-d, --defaults', 'Use default options')
  .option('-t, --template <name>', 'Template to use (base, tenancy)')
  .action(async (projectName: string | undefined, options) => {
    try {
      await createBackend(projectName, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

interface TemplateVars {
  PROJECT_NAME: string;
  PROJECT_SLUG: string;
  PROJECT_DESCRIPTION: string;
  PROJECT_AUTHOR: string;
  PORT: string;
  DB_NAME: string;
}

async function createBackend(projectName: string | undefined, options: CreateOptions) {
  console.log();
  console.log(chalk.cyan.bold('╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           OxLayer Backend API Generator               ║'));
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
      initial: 'my-api',
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
    vars = getTemplateVars(projectName);
  } else {
    vars = await promptForVars(projectName);
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

function getTemplateVars(projectName: string): TemplateVars {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dbName = slug.replace(/-/g, '_');

  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: `A new OxLayer backend API`,
    PROJECT_AUTHOR: '',
    PORT: '3001',
    DB_NAME: dbName,
  };
}

async function promptForVars(projectName: string): Promise<TemplateVars> {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dbName = slug.replace(/-/g, '_');

  const response = await prompts([
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: `A new OxLayer backend API`,
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
      message: 'API Port:',
      initial: 3001,
    },
  ]);

  return {
    PROJECT_NAME: toTitleCase(slug),
    PROJECT_SLUG: slug,
    PROJECT_DESCRIPTION: response.description,
    PROJECT_AUTHOR: response.author,
    PORT: String(response.port),
    DB_NAME: dbName,
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
  console.log(chalk.white('  pnpm dev'), '     - Start development server');
  console.log(chalk.white('  pnpm test'), '    - Run tests');
  console.log(chalk.white('  pnpm build'), '   - Build for production');
  console.log();
  console.log(chalk.cyan('Access points:'));
  console.log(chalk.white(`  API:         http://localhost:${vars.PORT}`));
  console.log(chalk.white(`  Docs:        http://localhost:${vars.PORT}/docs`));
  console.log(chalk.white(`  Metrics:     http://localhost:9090 (Prometheus)`));
  console.log(chalk.white(`  Dashboards:  http://localhost:3000 (Grafana)`));
  console.log();
}
