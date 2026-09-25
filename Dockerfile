# Production Dockerfile for Don't Do It Challenge
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy full application code
COPY . .

# Build Vite frontend assets into dist/
RUN npm run build

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Run full-stack Express + WebSocket server
CMD ["npx", "tsx", "server.ts"]
