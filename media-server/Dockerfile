# Stage 1: Builder

FROM node:22-bookworm-slim AS builder

# Install dependencies required by mediasoup
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Stage 2: Runtime
FROM node:22-bookworm-slim

WORKDIR /app

# Copy the pre-built node_modules and app code from builder stage, setting correct ownership
COPY --from=builder --chown=node:node /app /app

USER node

EXPOSE 3000

CMD ["npm", "start"]
