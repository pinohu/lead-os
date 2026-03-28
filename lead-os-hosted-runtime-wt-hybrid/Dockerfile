# =============================================================================
# Lead OS Hosted Runtime — Multi-Stage Dockerfile
#
# Stage 1 (deps):    Install production + dev dependencies.
# Stage 2 (builder): Run `next build` and produce .next/standalone output.
# Stage 3 (runner):  Copy only what the app needs to run. Final image is lean
#                    and runs as a non-root user.
#
# Requirements: next.config.mjs must have `output: "standalone"`.
# Target image size: <200 MB.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: deps
# Install all dependencies (prod + dev) so the builder has type definitions,
# etc. We use --mount=type=cache to speed up repeated builds.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# libc6-compat is required on Alpine for certain native Node bindings.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy manifests first so Docker layer cache is only invalidated when they change.
COPY package.json package-lock.json ./

# Install all deps (including devDependencies) — builder needs them.
RUN npm ci --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: builder
# Compile the application. Next.js standalone output copies only the server
# files needed to run, so we never ship the full node_modules to production.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Bring in node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source tree.
COPY . .

# NEXT_TELEMETRY_DISABLED avoids a network call during build time.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build. next build reads next.config.mjs and emits .next/standalone.
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: runner
# Minimal production image.  Only the standalone server output, the static
# assets, and the public directory are copied in.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user. Running as root inside a container is a security risk
# because a container breakout would yield root on the host.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# The standalone build copies its own minimal node_modules subset.
# Static assets from .next/static are served by the Next.js server directly.
COPY --from=builder /app/public ./public

# Pre-create the .next directory and set ownership so next.js can write
# the trace / cache files at runtime without needing root.
RUN mkdir -p .next \
 && chown nextjs:nodejs .next

# Copy the standalone server bundle and static output.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Drop to non-root user from here on.
USER nextjs

# Configurable port.  Default matches package.json start script.
EXPOSE 3000
ENV PORT=3000
# next start binds to 0.0.0.0 only when HOSTNAME is set; required inside Docker.
ENV HOSTNAME=0.0.0.0

# Health check: prod load-balancers (and docker-compose) will probe /api/health.
# Falls back to the root path if the dedicated health endpoint does not exist yet.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || \
      wget -qO- http://localhost:${PORT}/ || exit 1

# server.js is emitted by Next.js standalone output.
CMD ["node", "server.js"]
