########################################
# Builder
########################################
FROM node:24-alpine AS builder

WORKDIR /app

# Build-time envs (Next.js needs these at build)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_CLIENT_KEY
ARG NEXT_PUBLIC_APP_ID

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_CLIENT_KEY=$NEXT_PUBLIC_CLIENT_KEY
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js (standalone)
RUN npm run build

########################################
# Runner
########################################
FROM node:24-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only required build output
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["dumb-init", "node", "server.js"]
