FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/client/package.json src/client/package-lock.json ./src/client/

RUN npm ci
RUN npm --prefix src/client ci

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc -p tsconfig.json

WORKDIR /app/src/client
RUN npm exec vite build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server/db/migrations ./src/server/db/migrations

RUN mkdir -p /app/data/uploads

EXPOSE 8787

CMD ["sh", "-c", "node dist/server/db/migrate.js && node dist/server/index.js"]
