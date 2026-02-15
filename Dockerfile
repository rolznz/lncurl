# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.17.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ARG YARN_VERSION=1.22.22
RUN npm install -g yarn@$YARN_VERSION --force

# Build stage
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN yarn run build

# Build frontend
WORKDIR /app/frontend
RUN yarn install --frozen-lockfile --production=false
RUN yarn run build
WORKDIR /app

# Remove development dependencies
RUN yarn install --production=true

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/dist /app/dist
COPY --from=build /app/frontend/dist /app/frontend/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/prisma.config.ts /app/prisma.config.ts
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/src/generated /app/src/generated

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && yarn run start"]
