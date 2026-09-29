# Multi-stage production Dockerfile for Dhaka Tesla Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including build devDependencies)
COPY package*.json ./
RUN npm install

# Copy source code and compile TypeScript to dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create persistent storage folder for SQLite database
RUN mkdir -p /app/data

EXPOSE 5000

# Zero-dependency native Node 22 healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
