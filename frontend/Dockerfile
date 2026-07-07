# Stage 2: Serve the application using Nginx
FROM nginx:1.25-alpine

# Create writable directories
RUN mkdir -p /var/cache/nginx \
    /var/run \
    /tmp/nginx \
 && chmod -R 777 /var/cache/nginx /var/run /tmp/nginx /usr/share/nginx/html

# Configure nginx
RUN printf 'server {\n\
    listen 3000;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]