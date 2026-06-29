# Bast public website
#
# Build:
#   docker build -t bast-website:local .
#
# Run:
#   docker run -p 8080:8080 bast-website:local

FROM node:20-alpine AS builder
WORKDIR /app

ARG GA_MEASUREMENT_ID=""
ARG SITE_ENV="production"
ARG SITE_URL="https://www.bast.ai"
ARG ROBOTS_META="index, follow"

ENV GA_MEASUREMENT_ID=$GA_MEASUREMENT_ID
ENV SITE_ENV=$SITE_ENV
ENV SITE_URL=$SITE_URL
ENV ROBOTS_META=$ROBOTS_META

COPY package.json pnpm-lock.yaml* ./
COPY scripts ./scripts
COPY src ./src

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm verify

FROM nginx:1.27-alpine

ARG ROBOTS_HEADER="index, follow"
ENV ROBOTS_HEADER=$ROBOTS_HEADER

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health > /dev/null || exit 1

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
