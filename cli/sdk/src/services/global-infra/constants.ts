/**
 * Constants for Global OxLayer Infrastructure Service
 */

import { ServiceDefinition } from './types';

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // Core services
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Primary database (multi-tenant via databases)',
    category: 'core',
    ports: ['5432'],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Cache and session store (multi-tenant via DB numbers)',
    category: 'core',
    ports: ['6379'],
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    description: 'Message queue (multi-tenant via vhosts)',
    category: 'core',
    ports: ['5672', '15672'],
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    description: 'Identity and access management',
    category: 'core',
    ports: ['8080'],
    dependsOn: ['postgres'],
  },

  // Monitoring services
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics collection and storage',
    category: 'monitoring',
    ports: ['9090'],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Metrics visualization dashboard',
    category: 'monitoring',
    ports: ['3000'],
    dependsOn: ['prometheus'],
  },

  // Proxy
  {
    id: 'traefik',
    name: 'Traefik',
    description: 'Reverse proxy and load balancer',
    category: 'proxy',
    ports: ['80', '443', '8081'],
  },
];

export const CORE_SERVICES = ['postgres', 'redis', 'rabbitmq', 'keycloak'];
export const ALL_SERVICES = SERVICE_DEFINITIONS.map(s => s.id);

/**
 * Get individual service configurations for docker-compose
 */
export function getServiceConfigs(): Record<string, string> {
  return {
    'postgres': `  # PostgreSQL Database (multi-tenant)
  postgres:
    image: postgres:16-alpine
    container_name: ox-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: keycloak
    ports:
      - "5432:5432"
    volumes:
      - ox_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

    'redis': `  # Redis Cache (multi-tenant via DB number)
  redis:
    image: redis:7-alpine
    container_name: ox-redis
    ports:
      - "6379:6379"
    volumes:
      - ox_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

    'rabbitmq': `  # RabbitMQ Message Broker (multi-tenant via vhosts)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: ox-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - ox_rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

    'keycloak': `  # Keycloak Authentication Server
  keycloak:
    image: quay.io/keycloak/keycloak:26.5
    container_name: ox-keycloak
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://ox-postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 80
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTP_ENABLED: true
      KC_PROXY: edge
      KC_PROXY_HEADERS: "xforwarded"
      KC_SPI_OPTIONS_COOKIE_DEFAULT_SECURE: "false"
      KC_SPI_OPTIONS_COOKIE_DEFAULT_SAME_SITE: "lax"
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ox_keycloak_data:/opt/keycloak/data
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost:8080 && echo -e 'GET /health/ready HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' >&3 && cat <3 | grep -q '200 OK'"]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 30s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.entrypoints=web"
      - "traefik.http.routers.keycloak.middlewares=keycloak-headers"
      - "traefik.http.middlewares.keycloak-headers.headers.customrequestheaders.X-Forwarded-Proto=http"
      - "traefik.http.middlewares.keycloak-headers.headers.sslredirect=false"
      - "traefik.http.services.keycloak.loadbalancer.server.port=8080"
    networks:
      - ox_net
    restart: unless-stopped`,

    'prometheus': `  # Prometheus (metrics collection)
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: ox-prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=15d"
      - "--web.enable-lifecycle"
    ports:
      - "9090:9090"
    volumes:
      - ox_prometheus_data:/prometheus
    networks:
      - ox_net
    restart: unless-stopped`,

    'grafana': `  # Grafana (visualization)
  grafana:
    image: grafana/grafana:12.3.1
    container_name: ox-grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    volumes:
      - ox_grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - ox_net
    restart: unless-stopped`,

    'traefik': `  # Traefik Reverse Proxy
  traefik:
    image: traefik:v3.0
    container_name: ox-traefik
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entryPoints.web.address=:80"
      - "--entryPoints.websecure.address=:443"
      - "--entrypoints.web.http.middlewares=ssl-redirect@file"
      - "--serversTransport.insecureSkipVerify=true"
    ports:
      - "80:80"
      - "443:443"
      - "8081:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - ox_net
    restart: unless-stopped`,
  };
}
