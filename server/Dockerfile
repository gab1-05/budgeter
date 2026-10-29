# Base image
FROM node:20-alpine AS base
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm prune --production

# Production stage
FROM base AS prod
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
EXPOSE 5000
CMD ["npm", "start"]

# Worker stage
FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["node", "worker.js"]