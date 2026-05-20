FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ dist/
COPY --from=build /app/src/client/static/ src/client/static/
COPY --from=build /app/src/server/db/migrations/ src/server/db/migrations/

EXPOSE 8787

CMD ["sh", "-c", "node dist/server/db/migrate.js && node dist/server/index.js"]
