# Single-image build for self-hosting. Full deps are kept so migrate/seed
# tooling (tsx, drizzle-kit) is available at container start.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values so module-level config (db/auth) loads during `next build`.
# These do NOT carry to the runner stage; real values come from compose at runtime.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    SHARED_SECRET=build-time-placeholder \
    BETTER_AUTH_SECRET=build-time-placeholder \
    BETTER_AUTH_URL=http://localhost:3000
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app ./
EXPOSE 3000
# Migrate + seed are idempotent; safe to run on every start (single instance).
CMD ["sh", "-c", "npm run db:migrate && npm run seed && npm run start"]
