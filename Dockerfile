# Use nginx to serve static files
FROM nginx:alpine

# Add build argument for cache busting
ARG CACHEBUST=1

# Copy static files to nginx html directory
# The ARG ensures these layers rebuild when the value changes
COPY index.html /usr/share/nginx/html/
COPY game.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# Create nginx config template that uses PORT environment variable
RUN echo 'server { \
    listen $PORT; \
    listen [::]:$PORT; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Use shell form to substitute environment variables
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
