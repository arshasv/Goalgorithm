# =========================
# Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Copy lock + config files
COPY package.json ./

# Enable pnpm and install deps
RUN npm install

# Copy source
COPY . .

# Build-time ENV
ARG VITE_GRAPHQL_ENDPOINT
ENV VITE_GRAPHQL_ENDPOINT=$VITE_GRAPHQL_ENDPOINT

# Build frontend
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config (OpenShift compatible)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# OpenShift permissions (non-root compatible)
RUN chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html \
    && chmod -R g+rwX /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]