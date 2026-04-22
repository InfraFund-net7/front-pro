FROM node:22-alpine AS builder
WORKDIR /app

# Add libc6-compat for sharp/image optimization
RUN apk add --no-cache libc6-compat

# node:22-alpine ships npm 10; this lockfile is validated with npm 11 locally.
# npm 10 `npm ci` can fail with "Missing: zod@3.25.76 from lock file" on nested
# optional peers (wagmi / walletconnect). Use the same npm major as dev/CI lock authors.
RUN npm install -g npm@11.6.1

COPY package*.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Build args for NEXT_PUBLIC_* variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_CLIENT_KEY
ARG NEXT_PUBLIC_APP_ID
ARG NEXT_PUBLIC_ENVIRONMENT

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_CLIENT_KEY=$NEXT_PUBLIC_CLIENT_KEY
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

RUN npm run build


FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init ca-certificates
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy from builder with ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["dumb-init", "node", "server.js"]