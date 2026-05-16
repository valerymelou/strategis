# ----------------------------
# Stage 1: Build the Angular App
# ----------------------------
FROM node:25-alpine as builder

WORKDIR /app

# Arguments for build-time configuration
ARG ENV_API_ROOT
ARG ENV_API_VERSION
ARG ENV_API_CONTENT_TYPE
ARG ENV_GOOGLE_MAPS_API_KEY
ARG ENV_ENVIRONMENT
ARG ENV_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

# Set environment variables for the build
ENV ENV_API_ROOT=$ENV_API_ROOT
ENV ENV_API_VERSION=$ENV_API_VERSION
ENV ENV_API_CONTENT_TYPE=$ENV_API_CONTENT_TYPE
ENV ENV_GOOGLE_MAPS_API_KEY=$ENV_GOOGLE_MAPS_API_KEY
ENV ENV_ENVIRONMENT=$ENV_ENVIRONMENT
ENV ENV_SENTRY_DSN=$ENV_SENTRY_DSN

# Copy package files first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy workspace configuration
COPY nx.json tsconfig.base.json eslint.config.mjs jest.config.ts jest.preset.js .postcssrc.json ./

# Copy application source and libraries
COPY apps/strategis-web ./apps/strategis-web
COPY libs ./libs

# Build the SSR application
RUN npx nx run strategis-web:package

# Upload source maps to Sentry (skip if no auth token, e.g. local builds)
RUN if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
      npx @sentry/cli sourcemaps inject dist/apps/strategis-web && \
      npx @sentry/cli sourcemaps upload dist/apps/strategis-web && \
      find dist/apps/strategis-web -name "*.map" -delete; \
    fi

# ----------------------------
# Stage 2: Serve the App
# ----------------------------
FROM node:25-alpine

WORKDIR /app

# Install curl
RUN apk add --no-cache curl

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist/apps/strategis-web ./dist/apps/strategis-web
COPY --from=builder /app/package.json /app/yarn.lock ./

# Install only production dependencies to keep image small
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Expose the port Angular SSR runs on (default is 4000)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "dist/apps/strategis-web/proxy.mjs"]
