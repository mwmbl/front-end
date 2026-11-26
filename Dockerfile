FROM oven/bun:1.4.5-slim as base

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --production --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile
RUN bun run build

FROM base

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

EXPOSE 3000

CMD [ "bun", "start" ]
