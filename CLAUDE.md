<!-- cspell:words Openfort InfraFund Infrafund backpro frontpro Prisma prisma httpOnly Jotai nodemailer pino reCAPTCHA waitlists waitlist Sumsub uuidv sslmode prebuild knip cspell commitlint husky Turbopack -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

InfraFund Front Pro is a single Next.js 16 (App Router) application that hosts both the InfraFund frontend and the migrated backend API routes. It replaced a previous Go backend (`../backpro`) — see `docs-dev/tasks/task-100-nextjs-migration-plan.md` for the migration plan and endpoint parity matrix. Authentication and wallet lifecycle are owned by Openfort; app sessions, user profile, authorization, and CRUD endpoints are owned by Next.js API routes.

## Commands

```sh
npm run dev              # Next.js dev server on :3000
npm run dev:local        # Start local Postgres (docker), prisma db push, seed countries, then dev (logs → .next/dev-server.log)
npm run db:local:setup   # Local Postgres + schema + seeds only
npm run db:local:down    # Stop local Postgres
npm run db:generate      # prisma generate
npm run env:example      # Regenerate sanitized .env.example from .env.local
npm run build            # prisma generate (prebuild) + next build
npm run format           # eslint + prettier --check + cspell + knip
npm run fix:lint         # eslint --fix
npm run fix:prettier     # prettier --write
```

There is no test runner configured in `package.json`; do not invent test commands. CI/CD lints, builds, and dependency-checks are gating per `CONTRIBUTING.md`.

## Local environment notes

- `npm run dev:local` is the canonical dev entrypoint. It auto-detects whether `DATABASE_URL` is reachable; if not, it boots `deployment/docker-compose.local.yml`.
- Default local DB URL: `postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable`.
- Dev server output is mirrored to `.next/dev-server.log` — tail this file rather than re-running the server.
- Environment variable reference lives in `config-operation/environment-variables.md`. Never commit `.env.local`; regenerate `.env.example` via `npm run env:example`.
- Openfort test credentials and manual smoke-test flow are documented in `docs-dev/test/local-testing-runbook.md`.

## Architecture

### Boundary: client vs server

- `src/app/**` — Next.js App Router. Pages under feature folders (`account`, `kyc`, `investment-portal`, `tokenization`, etc.) and API routes under `src/app/api/{auth,cron,v1}/**`.
- `src/components/**`, `src/atoms/**` (Jotai), `src/lib/**` — client/shared code. `src/lib/openfort-config.tsx` wires the Openfort React provider; `src/lib/solana-kit-unavailable.ts` is aliased in for `@solana/kit` (see `next.config.ts`) to keep Solana out of the bundle.
- `src/server/**` — server-only code. Top of `src/server/env.ts` imports `server-only` to enforce this. **Never import from `src/server` in client components.**

### Server layering (`src/server`)

Layered top-down, dependencies flow downward only:

1. `auth/` — JWT (`jose`), httpOnly refresh cookies, lockout policy, token issuance.
2. `http/` — API helpers: `api-error`, `response`, `captcha` (reCAPTCHA), `request-metadata`. Use these for consistent route responses and errors.
3. `services/` — business logic: `auth`, `account`, `email` (nodemailer), `public-forms`, `cleanup` (cron).
4. `repositories/` — Prisma data access: `users`, `sessions`, `lockouts`, `public-forms`.
5. `db/` — Prisma client (uses `@prisma/adapter-pg`).
6. `openfort/session.ts` — server-side Openfort verification.
7. `validation/` — request schema validation.
8. `env.ts` — typed accessor for server env, gated per feature (`database`, `auth`, `openfort`, `captcha`, `email`, `shield`, `cron`).
9. `logger.ts` — pino.

### Auth model

Two-layer auth:

- **Openfort** issues identity (email/SMS OTP, social, etc.) and owns wallets. Server verifies the Openfort access token at `/api/v1/auth/openfort/exchange` and `/check`.
- **App session** is issued by this app: short-lived JWT access token + httpOnly refresh cookie. `/refresh` rotates, `/logout` revokes the row in `sessions`. Lockouts and audit logs gate repeated failures.

The `User.openfortUserId` column is the join key. Wallet creation is deferred until KYC qualification per the migration plan.

### Database

PostgreSQL via Prisma 7 with the `pg` adapter. Schema lives in `prisma/schema.prisma`; `uuidv7()` is used for IDs (Postgres-side). `prisma generate` runs as `prebuild` so production builds always have a fresh client. Seed scripts are plain Node ESM under `scripts/` (not Prisma's seed runner).

### Cron / cleanup

`src/app/api/cron/cleanup` is invoked by an external cron (deployment-defined) to expire sessions/lockouts/audit logs via `services/cleanup.ts`.

### Sentry / instrumentation

`instrumentation.ts`, `instrumentation-client.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` are wired through `withSentryConfig` in `next.config.ts`. Don't rename these without updating `next.config.ts`.

## Conventions

- Path alias: `@/*` → `src/*` (set in `tsconfig.json`).
- Output: `standalone` (used by the Railway/Docker deployment in `deployment/`).
- Commits follow Conventional Commits (commitlint + husky enforce this on commit).
- Knip is part of `npm run format` — unused exports/files will be flagged.
- cspell runs in `npm run format`; many docs include inline `<!-- cspell:words ... -->` directives — extend the dictionary inline rather than disabling cspell.

## Definition of Done (per CONTRIBUTING.md)

PRs require: green CI (lint/build/deps), tests for new logic, no coverage regression, SAST clean, self-review, peer review, then Tech Lead (Homayoun) approval before merge. Sven is auto-notified post-merge. The default branch for PRs is `develop`.

## Resources

### Sitemap (from figma)

directory : `docs-dev/resources/sitemap`

### Design

Design guidelines can be found here :

- `DESIGN.md`
- `.claude/skills/design/SKILL.md`

figma project : "Infrafund-local"
