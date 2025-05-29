# Multi-stage build for Image Processor service
FROM node:18-alpine AS base

# Install system dependencies for Sharp and image processing
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3 \
    make \
    g++

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for all workspaces
COPY package*.json yarn.lock* ./
COPY packages/ ./packages/
COPY services/image-processor/package.json ./services/image-processor/

# Install dependencies
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/image-processor/node_modules ./services/image-processor/node_modules

# Copy source code
COPY services/image-processor/ ./services/image-processor/
COPY packages/ ./packages/

# Change to service directory
WORKDIR /app/services/image-processor

# Generate Prisma client (if using Prisma)
RUN npx prisma generate || echo "No Prisma schema found, skipping generation"

# Build the application
RUN yarn build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Install only runtime dependencies for Sharp
RUN apk add --no-cache \
    vips \
    libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 imageprocessor

# Install runtime dependencies only
COPY --from=builder /app/services/image-processor/package.json ./
COPY --from=builder /app/services/image-processor/yarn.lock* ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application
COPY --from=builder --chown=imageprocessor:nodejs /app/services/image-processor/dist ./dist
COPY --from=builder --chown=imageprocessor:nodejs /app/services/image-processor/node_modules ./node_modules
COPY --from=builder --chown=imageprocessor:nodejs /app/services/image-processor/assets ./assets

# Create uploads directory
RUN mkdir -p /app/uploads && chown imageprocessor:nodejs /app/uploads

# Switch to non-root user
USER imageprocessor

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/app.js"]