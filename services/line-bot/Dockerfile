# Multi-stage build for LINE Bot service
FROM node:22-alpine AS base
# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for all workspaces
COPY ./yarn.lock* ./
COPY ./package.json ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY ./ ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 linebot

# Install runtime dependencies only
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock* ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application
COPY --from=builder --chown=linebot:nodejs /app/dist ./dist
COPY --from=builder --chown=linebot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=linebot:nodejs /app/prisma ./prisma
COPY --from=builder --chown=linebot:nodejs /app/assets ./assets

# Switch to non-root user
USER linebot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/app.js"]
