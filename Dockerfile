# Use specific nginx version for reproducibility
FROM nginx:1.25-alpine

# Add metadata labels
LABEL maintainer="Lt Dan's Run for Reelection Team"
LABEL version="1.0"
LABEL description="Frontend static files for Lt Dan's Run for Reelection game"

# Force complete rebuild with timestamp
ENV REBUILD_TIME=2025-10-01-1311
ARG CACHEBUST=2

# Create nginx directories
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp

# Copy static files to nginx html directory
# The ARG ensures these layers rebuild when the value changes
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY pagination.css /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY package.json /usr/share/nginx/html/
COPY political_runner_end_messages.json /usr/share/nginx/html/
COPY logo.png /usr/share/nginx/html/
COPY ticket.png /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src/
COPY sfx /usr/share/nginx/html/sfx/
COPY skins /usr/share/nginx/html/skins/

# Create enhanced nginx config template with security headers, cache control, and gzip compression
RUN echo 'gzip on; \
gzip_vary on; \
gzip_min_length 1024; \
gzip_types \
    text/plain \
    text/css \
    text/xml \
    text/javascript \
    application/javascript \
    application/xml+rss \
    application/json; \
\
server { \
    listen $PORT; \
    listen [::]:$PORT; \
    server_name _; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\''; style-src '\''self'\'' '\''unsafe-inline'\'' https://fonts.googleapis.com; img-src '\''self'\'' data: blob:; font-src '\''self'\'' data: https://fonts.gstatic.com; media-src '\''self'\'' blob:; connect-src '\''self'\'' https:;" always; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
        \
        # Set proper MIME type for JavaScript modules \
        location ~* \.js$ { \
            add_header Content-Type "application/javascript"; \
            expires -1; \
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        } \
        \
        # Prevent caching of CSS files \
        location ~* \.css$ { \
            expires -1; \
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        } \
        \
        # Cache static assets \
        location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ { \
            expires 30d; \
            add_header Cache-Control "public, immutable"; \
        } \
        \
        # Cache audio files \
        location ~* \.(mp3|wav|ogg|m4a)$ { \
            expires 7d; \
            add_header Cache-Control "public"; \
        } \
        \
        # Cache JSON files \
        location ~* \.json$ { \
            expires 1h; \
            add_header Cache-Control "public"; \
        } \
    } \
    \
    # Health check endpoint \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Create non-root user for security (nginx user already exists, just change ownership)
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Set proper permissions for all files including logo.png
RUN chown -R appuser:appuser /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /usr/share/nginx/html/*.png && \
    chmod 644 /usr/share/nginx/html/*.html && \
    chmod 644 /usr/share/nginx/html/*.css && \
    chmod 644 /usr/share/nginx/html/*.json && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80}/health || exit 1

# Expose port
EXPOSE $PORT

# Use shell form to substitute environment variables
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
