# Stage 1: Build Angular
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build --prod

# Stage 2: Run SSR server
FROM node:20-slim
WORKDIR /app

COPY --from=build /app/dist/yaya ./

EXPOSE 4000
CMD ["node", "server/server.mjs"]
