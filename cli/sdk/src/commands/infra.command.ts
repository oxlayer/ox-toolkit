/**
 * Infrastructure Command
 *
 * Project-level commands for global OxLayer infrastructure
 */

import { GlobalInfraService } from '../services/global-infra.service.js';
import { info, success, warning, error, header } from '../utils/cli.js';
import { basename } from 'path';
import { readFileSync } from 'fs';

const globalService = new GlobalInfraService();

/**
 * Get project name from package.json or directory name
 */
function getProjectName(): string {
  try {
    const packagePath = process.cwd() + '/package.json';
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return pkg.name || basename(process.cwd());
  } catch {
    return basename(process.cwd());
  }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL INFRASTRUCTURE COMMANDS
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize global infrastructure (Layer 1: Static Physical Infra)
 */
export async function globalInit(): Promise<void> {
  header('Initialize Global OxLayer Infrastructure');

  try {
    await globalService.initialize();
    success('Global infrastructure initialized');
    console.log();
    info('Next steps:');
    console.log('  1. Start global infra: ox global start');
    console.log('  2. Register projects: ox infra register');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Start global infrastructure
 */
export async function globalStart(): Promise<void> {
  header('Start Global OxLayer Infrastructure');

  try {
    await globalService.start();

    const projects = globalService.listProjects();
    if (projects.length > 0) {
      console.log();
      info('Registered projects:', projects.map((p) => p.name).join(', '));
    }
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Stop global infrastructure
 */
export async function globalStop(): Promise<void> {
  header('Stop Global OxLayer Infrastructure');

  try {
    await globalService.stop();
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Show global infrastructure status
 */
export async function globalStatus(): Promise<void> {
  header('Global OxLayer Infrastructure Status');

  try {
    const status = await globalService.getStatus();
    console.log('Status:', status);
    console.log();

    const projects = globalService.listProjects();
    if (projects.length > 0) {
      info(`Registered Projects (${projects.length}):`);
      for (const project of projects) {
        console.log(`  • ${project.name} (${project.path})`);
      }
    } else {
      info('No projects registered yet');
      console.log('  Register a project with: ox infra register');
    }
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// PROJECT COMMANDS
// ═══════════════════════════════════════════════════════════════

/**
 * Register current project (Layer 2: Runtime Provisioning)
 */
export async function infraRegister(): Promise<void> {
  header('Register Project to Global Infrastructure');

  const projectName = getProjectName();
  const projectPath = process.cwd();

  info(`Project: ${projectName}`);
  info(`Path: ${projectPath}`);
  console.log();

  // Check if already registered
  const existing = globalService.getProject(projectName);
  if (existing) {
    warning(`Project '${projectName}' is already registered`);
    await showProjectStatus(projectName);
    return;
  }

  // Check if global infra is running
  const isRunning = await globalService.isRunning();
  if (!isRunning) {
    warning('Global OxLayer infrastructure is not running');
    console.log();
    info('Starting global infrastructure...');
    await globalService.start();
    console.log();
  }

  try {
    // Register the project (runtime provisioning)
    await globalService.registerProject(projectName, projectPath);

    console.log();
    success('Project registered successfully');
    console.log();

    await showProjectStatus(projectName);
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Unregister current project
 */
export async function infraUnregister(): Promise<void> {
  header('Unregister Project from Global Infrastructure');

  const projectName = getProjectName();

  const existing = globalService.getProject(projectName);
  if (!existing) {
    warning(`Project '${projectName}' is not registered`);
    return;
  }

  info(`Project: ${projectName}`);
  console.log();

  try {
    await globalService.unregisterProject(projectName);
    success('Project unregistered');
    console.log();
    info('Note: Resources (databases, vhosts) have been preserved');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Show project status and connection URLs
 */
export async function infraStatus(): Promise<void> {
  header('Project Infrastructure Status');

  const projectName = getProjectName();
  await showProjectStatus(projectName);
}

/**
 * Show project status (internal)
 */
async function showProjectStatus(projectName: string): Promise<void> {
  const project = globalService.getProject(projectName);

  if (!project) {
    error(`Project '${projectName}' is not registered`);
    console.log();
    info('Register the project first:');
    console.log('  ox infra register');
    process.exit(1);
  }

  success(`Project: ${projectName}`);
  info(`Path: ${project.path}`);
  info(`Registered: ${new Date(project.createdAt).toLocaleString()}`);
  console.log();

  // Check if global infra is running
  const isRunning = await globalService.isRunning();
  if (isRunning) {
    success('Global infrastructure: Running');
  } else {
    warning('Global infrastructure: Not running');
  }
  console.log();

  header('Connection URLs');
  const strings = globalService.getConnectionStrings(projectName);

  console.log(`  DATABASE_URL:        ${strings.DATABASE_URL}`);
  console.log(`  REDIS_URL:           ${strings.REDIS_URL}`);
  console.log(`  REDIS_DB:            ${strings.REDIS_DB}`);
  console.log(`  RABBITMQ_URL:        ${strings.RABBITMQ_URL}`);
  console.log(`  KEYCLOAK_URL:        ${strings.KEYCLOAK_URL}`);
  console.log();
}

/**
 * Generate .env file for current project
 */
export async function infraEnv(): Promise<void> {
  header('Generate Environment File');

  const projectName = getProjectName();
  const project = globalService.getProject(projectName);

  if (!project) {
    error(`Project '${projectName}' is not registered`);
    console.log();
    info('Register the project first:');
    console.log('  ox infra register');
    process.exit(1);
  }

  const defaultPath = process.cwd() + '/.env.local';

  try {
    await globalService.generateEnvFile(projectName, defaultPath);
    success('Environment file generated');
    console.log();
    info(`File: ${defaultPath}`);
    console.log();
    info('Load this file in your application:');
    console.log('  Node.js: require("dotenv").config({ path: ".env.local" })');
    console.log('  Shell:   source .env.local');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Quick start (register if needed)
 */
export async function infraDev(): Promise<void> {
  header('OxLayer Infrastructure - Development Mode');

  const projectName = getProjectName();
  const project = globalService.getProject(projectName);

  if (!project) {
    // Project not registered, register it now
    info('Project not registered. Registering now...');
    console.log();
    await infraRegister();
  } else {
    // Project already registered, show status
    success(`Project '${projectName}' is already registered`);
    console.log();

    // Check if global infra is running
    const isRunning = await globalService.isRunning();
    if (!isRunning) {
      warning('Global infrastructure is not running');
      console.log();
      info('Starting global infrastructure...');
      await globalService.start();
      console.log();
    }

    await showProjectStatus(projectName);
  }
}

/**
 * List all registered projects
 */
export async function infraList(): Promise<void> {
  header('Registered Projects');

  const projects = globalService.listProjects();

  if (projects.length === 0) {
    info('No projects registered');
    console.log();
    info('Register a project with: ox infra register');
    return;
  }

  console.log();
  for (const project of projects) {
    console.log(`• ${project.name}`);
    console.log(`  Path: ${project.path}`);
    console.log(`  Resources:`);
    console.log(`    PostgreSQL: ${project.resources.postgres.database}`);
    console.log(`    Redis:      DB ${project.resources.redis.db}`);
    console.log(`    RabbitMQ:   ${project.resources.rabbitmq.vhost}`);
    console.log(`    Keycloak:   ${project.resources.keycloak.realm}`);
    console.log();
  }

  success(`Total: ${projects.length} projects`);
}

/**
 * Stop current project (alias for compatibility)
 */
export async function infraStop(): Promise<void> {
  header('Stop Project Services');

  warning('Note: In global infrastructure mode, services are shared');
  console.log();

  const projectName = getProjectName();
  const project = globalService.getProject(projectName);

  if (!project) {
    error(`Project '${projectName}' is not registered`);
    return;
  }

  info('To stop all infrastructure, use:');
  console.log('  ox global stop');
  console.log();
  info('To unregister this project, use:');
  console.log('  ox infra unregister');
}

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY ALIASES
// ═══════════════════════════════════════════════════════════════

/**
 * @deprecated Use globalInit instead
 */
export async function infraInit(): Promise<void> {
  await globalInit();
}

/**
 * @deprecated Use infraRegister instead
 */
export async function infraStart(): Promise<void> {
  await infraRegister();
}

/**
 * @deprecated Not applicable in global infra mode
 */
export async function infraRestart(): Promise<void> {
  warning('Note: In global infrastructure mode, services are always running');
  console.log();
  info('To restart global infrastructure, use:');
  console.log('  ox global stop && ox global start');
}

/**
 * @deprecated Use globalStatus instead
 */
export async function infraProject(): Promise<void> {
  await globalStatus();
}

/**
 * @deprecated Use ox global logs (not implemented yet)
 */
export async function infraLogs(service: string, follow: boolean): Promise<void> {
  warning('Note: In global infrastructure mode, logs are managed globally');
  console.log();
  info('To view logs, use:');
  console.log('  cd ~/.oxlayer/infra');
  console.log('  docker-compose logs ' + (follow ? '-f ' : '') + service);
  console.log();
  console.log('Or directly:');
  console.log('  docker logs ox-' + service + (follow ? ' -f' : ''));
}

/**
 * @deprecated Use infraStatus instead
 */
export async function showStatus(environment?: string): Promise<void> {
  await infraStatus();
}

/**
 * Run global infrastructure health check
 */
export async function globalDoctor(): Promise<void> {
  await globalService.runDoctor();
}

/**
 * Reset project resources
 */
export async function infraReset(projectName: string, confirm: boolean): Promise<void> {
  try {
    await globalService.resetProject(projectName, confirm);
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}
