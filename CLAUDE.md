# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InfraFund Dashboard** — a Next.js 15 App Router frontend for InfraFund, a real-world asset tokenization and investment platform. The app handles user authentication via Openfort (embedded wallets), KYC flows, project creation/exploration, investment management, and digital asset tracking.

## Commands

```bash
# Development
npm run dev               # Start dev server (http://localhost:3000)
npm run dev:clean         # Wipe .next cache then start dev server

# Build & production
npm run build             # Production build (standalone output)
npm run build-start       # Build then start

# Code quality (run all)
npm run format            # lint + prettier check + cspell + knip

# Fix issues
npm run fix:lint          # Auto-fix ESLint errors
npm run fix:prettier      # Auto-format with Prettier
```

There are no test scripts configured — CI relies on lint/build checks.

## Required Environment Variables

Create `.env.local` for local development:

```bash
# Required — Openfort publishable key (same as InfraFund backend config)
NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY=

# Required — backend API base URL (proxied through Next.js API routes)
NEXT_PUBLIC_API_BASE_URL=

# Optional — Openfort embedded wallet / Shield
NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY=
NEXT_PUBLIC_OPENFORT_EMBEDDED_CHAIN_ID=84532   # Base Sepolia by default
OPENFORT_SHIELD_SECRET_KEY=                    # Server-side only
OPENFORT_SHIELD_ENCRYPTION_SHARE=             # Server-side only

# Optional — used to construct ToS/Privacy URLs in Openfort modal
NEXT_PUBLIC_LANDING_URL=

# Optional — domain for survey_data cookie (cross-domain landing → app flow)
NEXT_PUBLIC_SURVEY_COOKIE_DOMAIN=
```

If `NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY` is missing the app renders an error screen instead of loading.

## Architecture

### Path aliases

```
@/*    → src/*
@public/* → public/*
```

### App Router structure

```
src/app/
├── layout.tsx                  # Root layout: OpenfortAppProvider → MainLayout
├── page.tsx                    # Redirects to /explore-projects
├── home/page.tsx               # Also redirects to /explore-projects
├── login/page.tsx              # Auth page (no sidebar/guard)
├── register/page.tsx           # Auth page (no sidebar/guard)
├── explore-projects/page.tsx
├── create-project/page.tsx
├── investment-portal/page.tsx
├── investment-requests/page.tsx
├── investor-management/page.tsx
├── asset-management/page.tsx
├── digital-assets/page.tsx
├── tokenization/page.tsx
├── kyc/page.tsx
├── swap/page.tsx
└── api/                        # Next.js API routes (proxy to backend)
    ├── auth/challenge/route.ts
    ├── auth/register/route.ts
    ├── login/route.ts
    ├── register/route.ts
    ├── balance/route.ts
    ├── deposit/route.ts
    └── openfort/encryption-session/route.ts
```

### Provider hierarchy

`OpenfortAppProvider` (Openfort SDK) wraps `MainLayout`, which splits routing into two modes:
- **Auth pages** (`/login`, `/register`): rendered centered without sidebar/header.
- **Dashboard pages**: wrapped in `DashboardOpenfortGuard` → renders sidebar + header + main content.

### Authentication flow

1. User lands on `/login` → `OpenfortAuthForm` renders an `<OpenfortButton />` (Openfort SDK).
2. On successful Openfort auth, the form calls `/api/login` (or `/api/register` for new users) passing the Openfort `userId` + `token`.
3. The API route proxies to the InfraFund backend, which returns an `access_token`.
4. `access_token` is stored in `localStorage` under the key `access_token`.
5. `DashboardOpenfortGuard` reads `localStorage.access_token`; if absent, it redirects to `/login`.

**Registration trigger**: The landing site sets a `survey_data` cookie containing role/type/contact info. The login page reads this cookie, clears it, and passes the payload to `OpenfortAuthForm` which routes to `/api/register` instead of `/api/login`.

### API proxy pattern

All client-side API calls go through `src/services/api.service.ts` → `src/utils/axios.utils.ts`. The axios instance has an interceptor that injects the `access_token` from localStorage as a Bearer token. The `reWriteUrl()` function in `api.service.ts` prefixes paths with `api/`, routing to the Next.js API routes above.

Server-side API routes use `src/utils/server-axios.ts` (plain axios, `baseURL = SERVER_URL`) or direct `axios` calls with `getServerUrl()` to reach the backend.

### State management

- **Jotai atoms** (`src/atoms/`) for lightweight client state (e.g., KYC wizard step and form data).
- **TanStack Query** available for server-state caching (import from `@tanstack/react-query`).
- No Redux or Zustand.

### Webpack aliases (next.config.ts)

Three custom aliases are configured to allow customizing/preloading Openfort internals:
- `openfort-internal-connect-modal` → Openfort's ConnectModal chunk (preloaded to avoid ChunkLoadError)
- `openfort-ui-provider-context` → Openfort's useOpenfort hook
- `infrafund-landing-legal-urls` → `src/lib/landing-legal-urls.ts`

A `NormalModuleReplacementPlugin` swaps Openfort's `PoweredByFooter` with `src/components/openfort/infra-powered-by-footer.tsx`.

### Styling

- Tailwind CSS v4 (PostCSS plugin, `@tailwindcss/postcss`).
- Global styles in `src/app/globals.css`.
- Dark background `#0C0C0D` is the base; blurred radial gradients (`#1A2A4AAD`) are fixed-position decorative elements in `MainLayout`.

## Deployment

- Build output: `standalone` (configured in `next.config.ts`).
- Docker: `deployment/Dockerfile` + `deployment/docker-compose.yml`, image name `infrafund-dashboard`.
- CI/CD: GitHub Actions (`.github/workflows/`). `develop` branch auto-deploys to dev; `main` deploys to production. `NEXT_PUBLIC_*` env vars are baked into the Docker image at build time as `--build-arg`.

## Contribution Guidelines

- Commits must follow **Conventional Commits** (enforced by commitlint + husky).
- PRs require: passing CI, peer review, then Tech Lead (code owner: `@ImanAlibeigi`) approval before merge.
- Use the PR template at `.github/pull_request_template.md`.
