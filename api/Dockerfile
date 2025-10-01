# Multi-stage build for smaller final image
FROM node:18.19-alpine AS builder

# Add metadata labels
LABEL maintainer="Lt Dan's Run for Reelection Team"
LABEL version="1.0"
LABEL description="Backend API for Lt Dan's Run for Reelection game"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for building if needed)
RUN npm install

# Copy source code
COPY . .

# Production stage
FROM node:18.19-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Set working directory
WORKDIR /app

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app .

# Remove unnecessary files that might have been copied
RUN rm -rf node_modules/.cache \
    && find node_modules -name "*.md" -delete \
    && find node_modules -name "*.txt" -delete \
    && find node_modules -name "LICENSE*" -delete

# Set Node.js memory limits and performance optimizations
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" \
    NPM_CONFIG_LOGLEVEL=warn

# Change ownership of the app directory
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3001

# Health check with more robust endpoint testing
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
