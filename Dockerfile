FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_FORENOTES_DEMO_MODE=0
ENV VITE_FORENOTES_DEMO_MODE=$VITE_FORENOTES_DEMO_MODE

COPY package.json package-lock.json ./
COPY src/client/package.json src/client/package-lock.json ./src/client/

RUN npm ci
RUN npm --prefix src/client ci

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc -p tsconfig.json

WORKDIR /app/src/client
RUN npm run build

FROM node:22-alpine AS runtime

RUN apk add --no-cache chromium
RUN addgroup -S forenotes && adduser -S -G forenotes forenotes

WORKDIR /app

ENV NODE_ENV=production
ENV APP_HOST=0.0.0.0
ENV APP_PORT=3000
ENV FORENOTES_DATA_DIR=/app/data
ENV PDF_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=forenotes:forenotes scripts ./scripts
COPY --from=build --chown=forenotes:forenotes /app/dist/server ./dist/server
COPY --from=build --chown=forenotes:forenotes /app/dist/shared ./dist/shared
COPY --from=build --chown=forenotes:forenotes /app/dist/client ./dist/client
COPY --from=build --chown=forenotes:forenotes /app/src/server/db/migrations ./src/server/db/migrations

RUN mkdir -p /app/data/uploads && chown -R forenotes:forenotes /app/data

USER forenotes

VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null || exit 1

CMD ["sh", "-c", "for i in $(seq 1 30); do node dist/server/db/migrate.js && exec node dist/server/index.js; echo \"Waiting for database before retrying migrations ($i/30)\" >&2; sleep 2; done; exit 1"]
