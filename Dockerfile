# Use nginx to serve static files
FROM nginx:alpine

# Force complete rebuild with timestamp
ENV REBUILD_TIME=2025-01-17-1838
ARG CACHEBUST=1

# Copy static files to nginx html directory
# The ARG ensures these layers rebuild when the value changes
COPY index.html /usr/share/nginx/html/
COPY game.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY soundManager.js /usr/share/nginx/html/
COPY sfx /usr/share/nginx/html/sfx/
COPY skins /usr/share/nginx/html/skins/

# Create nginx config template with cache control headers
RUN echo 'server { \
    listen $PORT; \
    listen [::]:$PORT; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
        # Prevent caching of JS/CSS files \
        location ~* \.(js|css)$ { \
            expires -1; \
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        } \
        # Allow caching of images \
        location ~* \.(jpg|jpeg|png|gif|ico|svg)$ { \
            expires 1d; \
        } \
    } \
}' > /etc/nginx/conf.d/default.conf.template

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Use shell form to substitute environment variables
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
