# Task 0.3.1 — Error reporting (Sentry) + user-friendly UX

Status: **Implemented — all sections Done** — 2026-04-17
Branch: `openfort`

---

## What’s causing the bottom-right “flag”

- It’s the **Sentry Feedback Widget** (`@sentry-internal/feedback`, class `.widget__actor`, `position: fixed` bottom-right).
- It is loaded indirectly via dependencies (seen in `@sentry/browser` exports) and appears to be initialized by a 3rd-party SDK path (Openfort stack).

## Underlying runtime errors observed (current console)

- **`Analytics SDK: TypeError: Failed to fetch`** (repeated) → a telemetry/analytics request failing (likely blocked endpoint/CORS/adblock/offline). Noisy but non-blocking.
- Build-time warnings:
  - `@metamask/sdk … Can't resolve '@react-native-async-storage/async-storage'` (warning noise; not user-facing).
  - `Lit is in dev mode` (non-critical).

## Goals

- Developer notifications via **our Sentry project DSN + alerts**.
- **Disable the feedback/flag widget in production only**.
- **Inline banner/toast** with friendly message for real UX-impacting failures.
- Report errors in **all environments (including local dev)**.

---

## Implementation plan & status

### 1) Add first-party Sentry (our DSN) — **Done**

- [x] Installed `@sentry/nextjs` (`^10.49.0`).
- [x] Added `sentry.client.config.ts` (DSN-gated; environment, release, `tracesSampleRate: 0.1`, **`beforeSend` filter** for noisy network errors).
- [x] Added `sentry.server.config.ts` and `sentry.edge.config.ts`.
- [x] Added **`instrumentation.ts`** at project root that lazy-imports `sentry.server.config` / `sentry.edge.config` based on `NEXT_RUNTIME`, and exports `onRequestError = Sentry.captureRequestError` for Next.js 15 server component error capture.
- [x] Wired `withSentryConfig(nextConfig, { silent: true })` in `next.config.ts`.
- [x] Added **`src/app/global-error.tsx`** that calls `Sentry.captureException` for uncaught React tree errors and renders a friendly retry UI.

Files:
- `next.config.ts`
- `instrumentation.ts`
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `src/app/global-error.tsx`

Remaining nice-to-haves:
- [ ] Add `instrumentation-client.ts` + `Sentry.captureRouterTransitionStart` for App Router navigation tracing (optional; current client config is auto-detected by `@sentry/nextjs`).
- [ ] Configure Sentry alert rules in the dashboard (new issue / regression / high-frequency).
- [ ] Inject `release` (commit SHA) via CI at build time.

### 2) Capture Openfort/auth/wallet errors with context — **Done**

- [x] `src/lib/error-reporting.ts` — `reportError(err, { area, tags, extra, severity, fingerprint })`.
- [x] `isNoisyNetworkError()` (exported) is used both by `reportError` (downgrade to breadcrumb) and by the client `beforeSend` (drop entirely before shipping to Sentry). Matches: `failed to fetch`, `networkerror`, `load failed`, `analytics sdk`.
- [x] `AuthSessionProvider` instrumented in:
  - [x] `bootstrapSession` (tag `stage: 'bootstrap'`)
  - [x] `createWalletIfNeeded` (tag `stage: 'create'`, extra `hasExistingWallet`)
  - [x] `completeOnboarding` (tag `stage: 'onboarding'`)
  - [x] `deleteAccount` (tag `stage: 'delete-account'`)
- [x] **`baseReportExtras()` helper** attaches `route` (from `usePathname`), `retryCount`, and truncated `openfortUserId` to every report.

Files:
- `src/lib/error-reporting.ts`
- `sentry.client.config.ts` (uses `isNoisyNetworkError` in `beforeSend`)
- `src/components/auth/auth-session-provider.tsx`

Remaining nice-to-haves:
- [ ] Call `Sentry.setUser({ id: hashed(openfortUserId) })` on sign-in / clear on sign-out for cross-event user context.
- [ ] Add a lightweight rate limiter / dedupe around `reportError` to prevent retry storms from spamming issues.

### 3) Disable the feedback/flag widget in production only — **Done**

- [x] `<html className="hide-feedback-widget">` when `NODE_ENV === 'production'` (in `src/app/layout.tsx`).
- [x] Global CSS rule `.hide-feedback-widget .widget__actor { display: none !important; }` in `src/app/globals.css`.

Files:
- `src/app/layout.tsx`
- `src/app/globals.css`

Remaining nice-to-haves:
- [ ] Broaden the selector (e.g. `[class*="widget__actor"]`) if upstream class names change.

### 4) Improve user-facing messaging — **Done**

- [x] `getUserFacingErrorMessage()` normalization layer (iframe/session/network cases) inside `AuthSessionProvider`.
- [x] `ErrorBanner` component (`src/components/ui/error-banner.tsx`) — dismissible, optional Retry.
- [x] **`classifyError()`** returns `recoverable` | `fatal`; stored in `errorCategory` state and exposed via `useAuthSession()`.
- [x] `commitUserFacingError()` helper: normalize raw message → set `error` + `errorCategory` in one place (used by bootstrap / wallet / onboarding / delete paths).
- [x] `deleteAccount` now uses the **normalized user-facing message** (raw still goes to Sentry `extra`).
- [x] Public routes: on `status === 'error'` render `<ErrorBanner />` above children (non-blocking).
- [x] Private routes:
  - `errorCategory === 'recoverable'` → `<ErrorBanner />` above a waiting loader (non-blocking, retryable).
  - `errorCategory === 'fatal'` → keep `AuthErrorState` (blocking retry card).

Files:
- `src/components/auth/auth-session-provider.tsx`
- `src/components/main-layout.tsx`
- `src/components/ui/error-banner.tsx`

### 5) Validation — **Done**

- [x] `npm run format:lint` — 0 errors, 0 warnings.
- [x] `npm run format:prettier` — all files use Prettier style.
- [x] `npm run format:cspell` — 0 issues.
- [x] `npm run format:knip` — 0 unused exports (only pre-existing `ignoreFiles` hints).
- [x] `npx tsc --noEmit` — clean.

---

## Env vars required

Add to deploy configs (Railway, CI, `.env.local`):

```
# Client (exposed to browser)
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development|staging|production
NEXT_PUBLIC_SENTRY_RELEASE=<commit-sha>

# Server / Edge (not exposed)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development|staging|production
SENTRY_RELEASE=<commit-sha>
```

Without `DSN`, the SDK is `enabled: false` and is a no-op — safe for local dev without setup.

---

## Files changed / added

Added:
- `instrumentation.ts`
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `src/app/global-error.tsx`
- `src/lib/error-reporting.ts`
- `src/components/ui/error-banner.tsx`
- `docs-dev/tasks/task-0.3.1-error-reporting-sentry.md` (this doc)

Modified:
- `next.config.ts` (wrap with `withSentryConfig`)
- `package.json` + `package-lock.json` (added `@sentry/nextjs`)
- `src/app/layout.tsx` (prod-only `hide-feedback-widget` class on `<html>`)
- `src/app/globals.css` (widget-hide rule)
- `src/components/auth/auth-session-provider.tsx` (reportError calls + `baseReportExtras` + `commitUserFacingError` + `classifyError` + `errorCategory` in context + `usePathname` for route tagging)
- `src/components/main-layout.tsx` (public + private route banner branching on `errorCategory`)

---

## Review notes (post-implementation)

Strengths:
- Clean separation: `reportError` is the single entry point — easy to extend (rate limit, sampling, PII scrubbing).
- Noise suppression is centralized (`isNoisyNetworkError`) and applied at **two layers**: SDK-level `beforeSend` (catches global `window.onerror`-style leaks) and the app-level `reportError` (downgrades to breadcrumb).
- Route + retryCount + truncated userId are on every captured issue for fast triage.
- Prod-only widget hiding preserves dev visibility of potential Sentry feedback while keeping the UX clean for end users.
- Sentry SDK is no-op without DSN, so nothing breaks for devs who haven’t set env vars.
- `errorCategory` gives the UI a clear, testable contract for recoverable vs fatal failures.
- `global-error.tsx` catches anything that slips past the providers and React boundaries.

Risks / residual work:
- No hashed user context yet (`Sentry.setUser`) — would help correlate events per user across sessions.
- No client-side dedupe around `reportError` (retry storms could still create multiple Sentry events with the same root cause — partly mitigated by `retryCount` tag).
- Sentry alert rules still need to be configured in the dashboard — implementation only handles sending; notifying devs is a Sentry-side config step.

Suggested next PR:
- Add `Sentry.setUser` on sign-in (hash of openfortUserId).
- Add simple dedupe (last-N fingerprints in a ref) in `reportError`.
- Wire commit SHA as `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE` in CI.
