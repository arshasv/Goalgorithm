# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package config files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the entire frontend source code
COPY . .

# Build application for production distribution
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.25-alpine AS runner

# Configure Nginx to serve the build output directory and support client-side routing on port 3000
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy production assets from prior build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port (corponds to frontend target container config)
EXPOSE 3000

# Start Nginx web service
CMD ["nginx", "-g", "daemon off;"]
