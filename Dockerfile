# Stage 1: Build Angular (cached better)
FROM node:20 AS build
WORKDIR /app

# Copy only dependency files first
COPY package.json package-lock.json ./

# Use clean, fast installs
RUN npm ci --omit=dev

# Copy source AFTER dependencies are cached
COPY . .

# Build Angular (Browser + SSR)
RUN npm run build


# Stage 2: Run SSR server
FROM node:20-slim
WORKDIR /app

# Only copy final distributables
COPY --from=build /app/dist/yaya ./

EXPOSE 4000
CMD ["node", "server/server.mjs"]
