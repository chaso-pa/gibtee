# Multi-stage build for Admin Panel (React + Vite)
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

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN yarn build

# Production stage with Nginx
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 1001 -S nodejs
RUN adduser -S admin -u 1001

# Change ownership of nginx directories
RUN chown -R admin:nodejs /usr/share/nginx/html
RUN chown -R admin:nodejs /var/cache/nginx
RUN chown -R admin:nodejs /var/log/nginx
RUN chown -R admin:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R admin:nodejs /var/run/nginx.pid

# Switch to non-root user
USER admin

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
