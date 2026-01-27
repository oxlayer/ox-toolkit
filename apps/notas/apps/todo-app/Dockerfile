# Production Dockerfile for Todo App
FROM oven/bun:1 AS base
WORKDIR /app

# Dependencies stage
FROM base AS install
COPY package.json bunfig.toml ./
COPY .npmrc.docker .npmrc
RUN bun install --frozen-lockfile --production

# Builder stage
FROM base AS build
COPY package.json bunfig.toml ./
COPY .npmrc.docker .npmrc
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

# Production stage
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "dist/index.js"]
