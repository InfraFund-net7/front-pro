FROM node:22-alpine AS builder
WORKDIR /app

# Add libc6-compat for sharp/image optimization
RUN apk add --no-cache libc6-compat

COPY package*.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Build args for NEXT_PUBLIC_* variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_OPENFORT_PUBLIC_KEY
ARG NEXT_PUBLIC_SHIELD_API_KEY
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_OPENFORT_PUBLIC_KEY=$NEXT_PUBLIC_OPENFORT_PUBLIC_KEY
ENV NEXT_PUBLIC_SHIELD_API_KEY=$NEXT_PUBLIC_SHIELD_API_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

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