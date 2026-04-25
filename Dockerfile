# ─── build stage ─────────────────────────────────────────────────
# Angular CLI + @angular/build live in devDependencies, so we need the full
# install (no --omit=dev) for the build to succeed.
FROM node:20 AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── runtime stage (SSR) ─────────────────────────────────────────
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production PORT=4000

COPY --from=build /app/dist/yaya ./

EXPOSE 4000
CMD ["node", "server/server.mjs"]
