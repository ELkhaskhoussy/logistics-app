# ─────────────────────────────────────────────
#  Stage 1 — Build
#  Installs deps & exports the Expo web bundle
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (layer-cache friendly)
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps needed for the build)
RUN npm ci

# Copy the rest of the source
COPY . .

# ── Build-time arguments ──────────────────────────────────────────────
# Override with --build-arg to target different environments:
#
#   Production (default):
#     docker build -t logistics-app-web .
#
#   Local dev (points to your machine's port 8080):
#     docker build --build-arg API_URL=http://host.docker.internal:8080 --build-arg APP_ENV=development -t logistics-app-web-local .
#
#   NOTE: Use host.docker.internal — NOT localhost.
#         Inside a container, localhost = the container itself, not your machine.
#         host.docker.internal is Docker Desktop's built-in hostname for the host.
ARG API_URL=http://84.46.254.94:8080
ARG APP_ENV=production

# Expose as ENV so Expo inlines them during `expo export`
ENV EXPO_PUBLIC_API_URL=$API_URL
ENV EXPO_PUBLIC_ENV=$APP_ENV

# Export the static web build → outputs to ./dist
RUN npx expo export -p web



# ─────────────────────────────────────────────
#  Stage 2 — Serve
#  Lightweight Nginx image, ~25 MB final image
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built static files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the SPA-aware Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on 80 inside the container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
