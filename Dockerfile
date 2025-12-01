# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Base
# ============================================
FROM node:18-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps

COPY package.json package-lock.json* ./

RUN npm ci

# ============================================
# Stage 3: Builder
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ARG GEMINI_API_KEY
ARG NEXT_PUBLIC_LIVEKIT_URL
ARG LIVEKIT_API_KEY
ARG LIVEKIT_API_SECRET
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG RESEND_API_KEY
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL
ENV LIVEKIT_API_KEY=$LIVEKIT_API_KEY
ENV LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ============================================
# Stage 4: Runner (Production)
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["node", "server.js"]
