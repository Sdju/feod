# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY docs/package.json docs/

RUN pnpm install --frozen-lockfile --filter @open-feod/docs...

COPY docs docs/

RUN pnpm --filter @open-feod/docs build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html

EXPOSE 80
