/**
 * OxLayer Tower - Frontend Application
 */

let currentProject = null;

// Initialize app
async function init() {
  const version = await window.oxlayer.getVersion();
  console.log('OxLayer Tower v' + version);

  await loadProjects();
  await loadInfraStatus();
}

// Load projects from registry
async function loadProjects() {
  const projectList = document.getElementById('project-list');
  projectList.innerHTML = '<div class="loading">Loading projects...</div>';

  try {
    const projects = await window.oxlayer.getProjects();

    if (projects.length === 0) {
      projectList.innerHTML = '<div class="empty-state">No projects registered.<br><button class="btn btn-primary" onclick="openRegisterModal()">+ Register Project</button></div>';
      return;
    }

    let html = '<ul class="project-list">';
    for (const project of projects) {
      html += `
        <li class="project-item">
          <div class="project-info">
            <h4>${project.name}</h4>
            <p>${project.path}</p>
            <div class="resource-grid">
              <div class="resource-item">🗄️ ${project.resources.postgres.database}</div>
              <div class="resource-item">⚡ Redis DB ${project.resources.redis.db}</div>
              <div class="resource-item">🐰 ${project.resources.rabbitmq.vhost}</div>
              <div class="resource-item">🔑 ${project.resources.keycloak.realm}</div>
            </div>
          </div>
          <div class="project-actions">
            <button class="btn btn-secondary btn-sm" onclick="showConnections('${project.name}')">Connections</button>
            <button class="btn btn-secondary btn-sm" onclick="generateEnv('${project.name}')">.env</button>
            <button class="btn btn-danger btn-sm" onclick="resetProject('${project.name}')">Reset</button>
          </div>
        </li>
      `;
    }
    html += '</ul>';
    projectList.innerHTML = html;
  } catch (error) {
    projectList.innerHTML = `<div class="empty-state">Error loading projects: ${error.message}</div>`;
  }
}

// Load infrastructure status
async function loadInfraStatus() {
  const statusEl = document.getElementById('infra-status');

  // TODO: Call oxlayer.getInfraStatus()
  statusEl.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-postgres</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-redis</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-rabbitmq</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-keycloak</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-prometheus</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-grafana</span>
      </div>
      <div class="resource-item">
        <span class="status-badge status-healthy">✓ ox-traefik</span>
      </div>
    </div>
    <p style="margin-top: 10px; color: #aaa; font-size: 12px;">
      All 7 services running •
      <a href="#" style="color: #e94560;" onclick="return false;">View logs</a> •
      <a href="http://grafana.localhost" target="_blank" style="color: #e94560;">Grafana →</a>
    </p>
  `;
}

// Show login modal
function showLogin() {
  const email = prompt('Enter your OxLayer email:');
  if (!email) return;

  const password = prompt('Enter your password:');
  if (!password) return;

  handleLogin(email, password);
}

// Handle login
async function handleLogin(email, password) {
  try {
    const result = await window.oxlayer.login(email, password);

    if (result.success) {
      document.getElementById('user-email').textContent = email;
      alert('Logged in successfully!');
      location.reload();
    } else {
      alert('Login failed: ' + result.error);
    }
  } catch (error) {
    alert('Login error: ' + error.message);
  }
}

// Show connection URLs
function showConnections(projectName) {
  alert('TODO: Show connections for ' + projectName);
}

// Generate .env file
async function generateEnv(projectName) {
  alert('TODO: Generate .env file for ' + projectName);
}

// Reset project
async function resetProject(projectName) {
  const confirm = window.confirm(
    `⚠️ WARNING: This will DELETE all resources for project '${projectName}'\n\n` +
    'This will:\n' +
    '  • Drop PostgreSQL database\n' +
    '  • Delete RabbitMQ vhost\n' +
    '  • Remove from registry\n\n' +
    'This cannot be undone! Continue?'
  );

  if (!confirm) return;

  try {
    await window.oxlayer.resetProject(projectName, true);
    alert('✅ Project reset successfully!');
    await loadProjects();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Run doctor
async function runDoctor() {
  alert('TODO: Run infrastructure health check');
}

// Open register modal
function openRegisterModal() {
  const projectName = prompt('Enter project name:');
  if (!projectName) return;

  alert('TODO: Register project ' + projectName);
}

// Initialize on load
init();
