# ── Stage 1: BUILD ───────────────────────────────────
# Use Node to build the React app into static files
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the React app
# VITE_API_URL is passed at build time
ARG VITE_API_URL=http://localhost:10000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: SERVE ───────────────────────────────────
# Throw away Node, use Nginx to serve static files
# Final image has no Node, no source code, no node_modules
FROM nginx:alpine

# Copy built files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
