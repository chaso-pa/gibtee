# Multi-stage build for LINE Bot service
FROM node:22-alpine AS base
# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for all workspaces
COPY services/line-bot/yarn.lock* ./services/line-bot/
COPY services/line-bot/package.json ./services/line-bot/

# Install dependencies
RUN yarn --cwd ./services/line-bot install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/services/line-bot/node_modules ./services/line-bot/node_modules

# Copy source code
COPY services/line-bot/ ./services/line-bot/
COPY packages/ ./packages/

# Change to service directory
WORKDIR /app/services/line-bot

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
COPY --from=builder /app/services/line-bot/package.json ./
COPY --from=builder /app/services/line-bot/yarn.lock* ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application
COPY --from=builder --chown=linebot:nodejs /app/services/line-bot/dist ./dist
COPY --from=builder --chown=linebot:nodejs /app/services/line-bot/node_modules ./node_modules
COPY --from=builder --chown=linebot:nodejs /app/services/line-bot/prisma ./prisma
COPY --from=builder --chown=linebot:nodejs /app/services/line-bot/assets ./assets

# Switch to non-root user
USER linebot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/app.js"]
