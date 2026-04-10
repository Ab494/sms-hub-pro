# ── Base image ───────────────────────────────────────
# Node 18 Alpine — small and fast
FROM node:18-alpine

# ── Working directory ────────────────────────────────
WORKDIR /app

# ── Copy dependencies first (for caching) ───────────
# Docker caches this layer — if package.json hasn't changed,
# npm install is skipped on next build (much faster)
COPY package*.json ./

# ── Install dependencies ─────────────────────────────
RUN npm install

# ── Copy app code ────────────────────────────────────
COPY . .

# ── Create uploads directory ─────────────────────────
# The app accepts CSV/Excel file uploads
# This directory must exist inside the container
RUN mkdir -p uploads

# ── Expose port ──────────────────────────────────────
EXPOSE 10000

# ── Start the app ────────────────────────────────────
CMD ["node", "server.js"]
