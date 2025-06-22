# syntax=docker.io/docker/dockerfile:1

FROM node:22-bullseye AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY --link package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --link --from=deps /app/node_modules ./node_modules
COPY --link . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --link --from=builder --chown=1001:1001 /app/public ./public
COPY --link --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --link --from=builder --chown=1001:1001 /app/.next ./.next
COPY --link --from=builder --chown=1001:1001 /app/dist ./dist
COPY --link --from=builder --chown=1001:1001 /app/package.json .
COPY --link --from=builder --chown=1001:1001 /app/package-lock.json .
COPY --link --from=builder --chown=1001:1001 /app/prisma ./prisma
COPY --link --from=builder --chown=1001:1001 /app/paths-bootstrap.js .

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "run", "start:docker"]