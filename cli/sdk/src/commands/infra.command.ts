/**
 * Infrastructure Command
 *
 * Manage OxLayer infrastructure using Docker Compose
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { InfraService, SERVICE_DEFINITIONS, ENVIRONMENT_CONFIGS } from '../services/infra.service.js';
import { InfraConfigService } from '../services/infra-config.service.js';
import { info, success, warning, error, header, createSpinner } from '../utils/cli.js';
import type { Environment, ServiceDefinition } from '../types/infra.js';

const infraService = new InfraService();
const configService = new InfraConfigService();

/**
 * Select services interactively
 */
async function selectServices(environment: Environment): Promise<string[]> {
  const defaultServices = ENVIRONMENT_CONFIGS[environment].defaultServices;
  const services = Object.entries(SERVICE_DEFINITIONS).sort(([, a], [, b]) =>
    a.category.localeCompare(b.category)
  );

  header('Select Services to Run');

  // Group services by category for display
  const servicesByCategory: Record<string, typeof services> = {};
  for (const [name, service] of services) {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = [];
    }
    servicesByCategory[service.category].push([name, service]);
  }

  // Show services grouped by category
  for (const [category, categoryServices] of Object.entries(servicesByCategory)) {
    console.log();
    console.log(chalk.bold.white(category.toUpperCase()));
    for (const [name, service] of categoryServices) {
      const isDefault = defaultServices.includes(name);
      const defaultIndicator = isDefault ? chalk.green('✓') : chalk.gray('○');
      console.log(
        `  ${defaultIndicator} ${chalk.white(service.displayName)} ${chalk.gray(`(${service.ports.join(', ')})`)}`
      );
      console.log(`    ${chalk.gray(service.description)}`);
    }
  }

  console.log();
  info(`Run ${chalk.green('ox infra list')} to see all available services with details`);
  console.log();

  const { choice } = await prompts({
    type: 'select',
    name: 'choice',
    message: 'Select service set:',
    choices: [
      { title: 'Core Services (recommended for development)', value: 'core' },
      { title: 'Core + Monitoring', value: 'monitoring' },
      { title: 'All Services', value: 'all' },
      { title: 'Custom selection', value: 'custom' },
    ],
    initial: 0,
  });

  let selectedServices: string[] = [];

  switch (choice) {
    case 'core':
      selectedServices = defaultServices;
      break;
    case 'monitoring':
      selectedServices = [
        ...defaultServices,
        'prometheus',
        'grafana',
      ];
      break;
    case 'all':
      selectedServices = Object.keys(SERVICE_DEFINITIONS);
      break;
    case 'custom':
      // Create a simple select for each service
      console.log();
      console.log(chalk.bold.white('Custom Service Selection'));
      console.log(chalk.gray('Select services one by one (press Enter to select, Esc to finish)'));
      console.log();

      const customChoices = services.map(([name, service]) => ({
        title: `${service.displayName} ${chalk.gray(`(${service.category})`)}`,
        value: name,
        selected: defaultServices.includes(name),
      }));

      const { services: customServices } = await prompts({
        type: 'multiselect',
        name: 'services',
        message: 'Select services:',
        instructions: false,
        choices: customChoices,
      });

      if (!customServices || customServices.length === 0) {
        warning('No services selected. Using default services.');
        return defaultServices;
      }

      selectedServices = customServices;
      break;
    default:
      selectedServices = defaultServices;
  }

  return selectedServices;
}

/**
 * Show service status
 */
export async function showStatus(environment: Environment): Promise<void> {
  const spinner = createSpinner('Fetching service status...');
  spinner.start();

  try {
    const services = await infraService.getServiceStatus();
    spinner.stop();

    header(`Service Status - ${ENVIRONMENT_CONFIGS[environment].displayName}`);

    if (services.length === 0) {
      info('No services are currently running');
      return;
    }

    // Group by category
    const servicesByCategory: Record<string, typeof services> = {};
    for (const service of services) {
      const definition = SERVICE_DEFINITIONS[service.name];
      if (definition) {
        if (!servicesByCategory[definition.category]) {
          servicesByCategory[definition.category] = [];
        }
        servicesByCategory[definition.category].push(service);
      }
    }

    for (const [category, categoryServices] of Object.entries(servicesByCategory)) {
      console.log();
      console.log(chalk.bold.white(category.toUpperCase()));

      for (const service of categoryServices) {
        const definition = SERVICE_DEFINITIONS[service.name];
        const statusColor =
          service.status === 'running' ? chalk.green : service.status === 'stopped' ? chalk.yellow : chalk.red;

        console.log(
          `  ${statusColor('●')} ${chalk.white(definition?.displayName || service.name)} ${chalk.gray(`(${service.status})`)}`
        );

        if (service.ports.length > 0) {
          console.log(`    ${chalk.gray('Ports:')} ${service.ports.join(', ')}`);
        }

        if (service.health) {
          const healthColor = service.health === 'healthy' ? chalk.green : chalk.yellow;
          console.log(`    ${chalk.gray('Health:')} ${healthColor(service.health)}`);
        }
      }
    }

    console.log();
    success(`Total: ${services.length} services`);
  } catch (err: any) {
    spinner.stop();
    error(`Failed to fetch service status: ${err.message}`);
  }
}

/**
 * Start services
 */
export async function infraStart(environment: Environment): Promise<void> {
  // Check if infra exists
  if (!infraService.checkInfraExists(environment)) {
    error(
      `Infrastructure files not found for ${environment}. Make sure you're in the correct directory.`
    );
    process.exit(1);
  }

  header(`Start Infrastructure - ${ENVIRONMENT_CONFIGS[environment].displayName}`);

  info('Environment configuration:');
  console.log(`  ${chalk.gray('•')} Environment: ${chalk.white(environment)}`);
  console.log(`  ${chalk.gray('•')} Docker Compose: ${chalk.white(ENVIRONMENT_CONFIGS[environment].dockerComposeFile)}`);
  console.log();

  // Select services
  const services = await selectServices(environment);

  info(`Selected ${services.length} services:`);
  for (const service of services) {
    const definition = SERVICE_DEFINITIONS[service];
    console.log(`  ${chalk.gray('•')} ${chalk.white(definition?.displayName || service)}`);
  }
  console.log();

  const { confirm: confirmed } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Start these services?',
    initial: true,
  });

  if (!confirmed) {
    warning('Aborted');
    return;
  }

  const spinner = createSpinner('Starting services...');
  spinner.start();

  try {
    await infraService.startServices(services, environment);
    spinner.stop();
    success(`Started ${services.length} services successfully`);
    console.log();

    info('Service URLs:');
    for (const service of services) {
      const definition = SERVICE_DEFINITIONS[service];
      if (definition && definition.ports.length > 0) {
        for (const port of definition.ports) {
          const [containerPort, hostPort] = port.split(':');
          if (containerPort === hostPort) {
            // Show common service URLs
            if (service === 'keycloak' || service === 'keycloak-proxy') {
              if (containerPort === '8080') {
                console.log(`  ${chalk.gray('•')} ${chalk.white(definition.displayName)}: ${chalk.cyan(`http://localhost:${hostPort}`)}`);
              } else if (containerPort === '8081') {
                console.log(`  ${chalk.gray('•')} ${chalk.white(`${definition.displayName} (Alt)`)}: ${chalk.cyan(`http://localhost:${hostPort}`)}`);
              }
            } else if (service === 'rabbitmq' && containerPort === '15672') {
              console.log(`  ${chalk.gray('•')} ${chalk.white(`${definition.displayName} Management UI`)}: ${chalk.cyan(`http://localhost:${hostPort}`)}`);
            } else if (service === 'grafana') {
              console.log(`  ${chalk.gray('•')} ${chalk.white(definition.displayName)}: ${chalk.cyan(`http://localhost:${hostPort}`)}`);
            } else if (service === 'prometheus') {
              console.log(`  ${chalk.gray('•')} ${chalk.white(definition.displayName)}: ${chalk.cyan(`http://localhost:${hostPort}`)}`);
            }
          }
        }
      }
    }
    console.log();

    info('Use "ox infra status" to check service health');
  } catch (err: any) {
    spinner.stop();
    error(`Failed to start services: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Stop services
 */
export async function infraStop(environment: Environment): Promise<void> {
  if (!infraService.checkInfraExists(environment)) {
    error(`Infrastructure files not found for ${environment}.`);
    process.exit(1);
  }

  header(`Stop Infrastructure - ${ENVIRONMENT_CONFIGS[environment].displayName}`);

  const spinner = createSpinner('Fetching service status...');
  spinner.start();

  try {
    const services = await infraService.getServiceStatus();
    spinner.stop();

    if (services.length === 0) {
      info('No services are currently running');
      return;
    }

    info(`Found ${services.length} running services`);

    const { all } = await prompts({
      type: 'confirm',
      name: 'all',
      message: 'Stop all services? (Select "No" to choose specific services)',
      initial: true,
    });

    let servicesToStop: string[] = [];

    if (all) {
      servicesToStop = services.map((s) => s.name);
    } else {
      const { selectedServices } = await prompts({
        type: 'multiselect',
        name: 'selectedServices',
        message: 'Select services to stop:',
        choices: services.map((s) => ({
          title: `${SERVICE_DEFINITIONS[s.name]?.displayName || s.name} ${chalk.gray(`(${s.status})`)}`,
          value: s.name,
        })),
      });

      if (!selectedServices || selectedServices.length === 0) {
        warning('No services selected');
        return;
      }

      servicesToStop = selectedServices;
    }

    const stopSpinner = createSpinner('Stopping services...');
    stopSpinner.start();

    await infraService.stopServices(servicesToStop, environment);

    stopSpinner.stop();
    success(`Stopped ${servicesToStop.length} services`);
  } catch (err: any) {
    spinner.stop();
    error(`Failed to stop services: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Restart services
 */
export async function infraRestart(environment: Environment): Promise<void> {
  if (!infraService.checkInfraExists(environment)) {
    error(`Infrastructure files not found for ${environment}.`);
    process.exit(1);
  }

  header(`Restart Infrastructure - ${ENVIRONMENT_CONFIGS[environment].displayName}`);

  const spinner = createSpinner('Fetching service status...');
  spinner.start();

  try {
    const services = await infraService.getServiceStatus();
    spinner.stop();

    const runningServices = services.filter((s) => s.status === 'running');

    if (runningServices.length === 0) {
      info('No services are currently running');
      return;
    }

    info(`Found ${runningServices.length} running services`);

    const { selectedServices } = await prompts({
      type: 'multiselect',
      name: 'selectedServices',
      message: 'Select services to restart:',
      instructions: false,
      choices: runningServices.map((s) => ({
        title: SERVICE_DEFINITIONS[s.name]?.displayName || s.name,
        value: s.name,
        selected: true,
      })),
    });

    if (!selectedServices || selectedServices.length === 0) {
      warning('No services selected');
      return;
    }

    const restartSpinner = createSpinner('Restarting services...');
    restartSpinner.start();

    await infraService.restartServices(selectedServices, environment);

    restartSpinner.stop();
    success(`Restarted ${selectedServices.length} services`);
  } catch (err: any) {
    spinner.stop();
    error(`Failed to restart services: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show logs
 */
export async function infraLogs(serviceName: string, follow: boolean): Promise<void> {
  const spinner = createSpinner('Fetching logs...');
  spinner.start();

  try {
    spinner.stop();
    await infraService.getServiceLogs(serviceName, 100, follow);
  } catch (err: any) {
    spinner.stop();
    error(`Failed to fetch logs: ${err.message}`);
    process.exit(1);
  }
}

/**
 * List available services
 */
export async function infraList(): Promise<void> {
  header('Available Services');

  const servicesByCategory: Record<string, ServiceDefinition[]> = {};
  for (const service of Object.values(SERVICE_DEFINITIONS)) {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = [];
    }
    servicesByCategory[service.category].push(service);
  }

  for (const [category, categoryServices] of Object.entries(servicesByCategory)) {
    console.log();
    console.log(chalk.bold.white(category.toUpperCase()));

    for (const service of categoryServices) {
      console.log(`  ${chalk.cyan('•')} ${chalk.white(service.displayName)} ${chalk.gray(`(${service.name})`)}`);
      console.log(`    ${chalk.gray(service.description)}`);

      if (service.ports.length > 0) {
        console.log(`    ${chalk.gray('Ports:')} ${chalk.yellow(service.ports.join(', '))}`);
      }

      if (service.dependsOn.length > 0) {
        console.log(`    ${chalk.gray('Depends on:')} ${service.dependsOn.join(', ')}`);
      }

      if (service.enabledByDefault) {
        console.log(`    ${chalk.green('Enabled by default in dev environment')}`);
      }
    }
  }

  console.log();
  success(`Total: ${Object.values(SERVICE_DEFINITIONS).length} services available`);
}

/**
 * Initialize project infrastructure
 */
export async function infraInit(): Promise<void> {
  header('Initialize Project Infrastructure');

  const projectName = configService.getProjectName();
  info(`Project: ${chalk.white(projectName)}`);
  console.log();

  if (configService.hasProjectInfra()) {
    warning('Project infrastructure folder already exists');
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Reinitialize infrastructure folder?',
      initial: false,
    });

    if (!overwrite) {
      info('Using existing infrastructure configuration');
      return;
    }
  }

  const spinner = createSpinner('Creating infrastructure folders...');
  spinner.start();

  try {
    configService.initializeProjectInfra();
    spinner.stop();

    success('Project infrastructure initialized');

    console.log();
    header('Created Folders');

    const folders = [
      { name: 'collectors', description: 'Custom OpenTelemetry collector configurations' },
      { name: 'nginx', description: 'Custom nginx configurations' },
      { name: 'grafana/provisioning', description: 'Grafana dashboards and datasources' },
      { name: 'prometheus', description: 'Prometheus configuration' },
      { name: 'volumes', description: 'Project-specific data volumes' },
    ];

    for (const folder of folders) {
      console.log(`  ${chalk.cyan('✓')} ${chalk.white(folder.name)}`);
      console.log(`    ${chalk.gray(folder.description)}`);
    }

    console.log();
    success('Infrastructure folder structure created at .ox/infra/');
    console.log();
    info('Next steps:');
    console.log(`  ${chalk.gray('1.')} Add custom configurations to folders in ${chalk.cyan('.ox/infra/')}`);
    console.log(`  ${chalk.gray('2.')} Run ${chalk.cyan('ox infra dev')} to start development environment`);
    console.log(`  ${chalk.gray('3.')} Custom configs will be automatically mounted to services`);
  } catch (err: any) {
    spinner.stop();
    error(`Failed to initialize: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show project infrastructure status
 */
export async function infraProject(): Promise<void> {
  header('Project Infrastructure Status');

  const projectName = configService.getProjectName();
  info(`Project: ${chalk.white(projectName)}`);
  console.log();

  if (!configService.hasProjectInfra()) {
    warning('No project infrastructure folder found');
    console.log();
    info('Run "ox infra init" to initialize project infrastructure');
    return;
  }

  success('Project infrastructure folder exists');
  console.log();

  // Check for custom configurations
  const { existsSync } = await import('fs');
  const { join } = await import('path');

  const infraPath = join(process.cwd(), '.ox', 'infra');

  const checks = [
    { name: 'Custom Collectors', path: join(infraPath, 'collectors') },
    { name: 'Custom Nginx', path: join(infraPath, 'nginx') },
    { name: 'Grafana Provisioning', path: join(infraPath, 'grafana', 'provisioning') },
    { name: 'Prometheus Config', path: join(infraPath, 'prometheus') },
    { name: 'Project Volumes', path: join(infraPath, 'volumes') },
  ];

  console.log(chalk.bold.white('Custom Configurations:'));

  for (const check of checks) {
    const hasFiles = existsSync(check.path);
    const status = hasFiles ? chalk.green('✓') : chalk.gray('○');
    const statusText = hasFiles ? chalk.green('Configured') : chalk.gray('Not configured');
    console.log(`  ${status} ${chalk.white(check.name)} - ${statusText}`);
  }

  console.log();
}

