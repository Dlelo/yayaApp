# frontend/Dockerfile (Angular SSR)
# 1) Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build SSR
COPY . .
RUN npm run build:ssr

# 2) Runtime stage
FROM node:22-slim AS runtime
WORKDIR /app
# copy only the dist output
COPY --from=build /app/dist /app/dist

EXPOSE 4000
# Run Angular SSR server (adjust path if your app name differs)
CMD ["node", "dist/yaya/server/server.mjs"]
