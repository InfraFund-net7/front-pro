<!-- cspell:words infrafunds Referer -->

# Openfort Google login fails on `dashboard.infrafund.net` (prod), works on `dash-dev.infrafund.net`

**Status:** UNRESOLVED — filed upstream as [openfort-xyz/openfort-js#276](https://github.com/openfort-xyz/openfort-js/issues/276) on 2026-05-06.
**Last updated:** 2026-05-07
**Environment:** Openfort test mode, project `pro_fbe07139-a184-41fd-8b55-bbe383bcf826`, publishable key `pk_test_0fe78...a0ce`, shared by both deployments.
**SDK versions:** `@openfort/openfort-js@^1.3.3`, `@openfort/react@^1.0.15`.

## Problem

Google login via Openfort works on **`https://dash-dev.infrafund.net`** but fails on **`https://dashboard.infrafund.net`** with:

```
POST https://api.openfort.io/iam/v2/auth/sign-in/social  →  403 Forbidden
{"message":"Invalid callbackURL","code":"INVALID_CALLBACK_URL"}
```

Request payload sent by the SDK in the failing call:

```json
{
  "provider": "google",
  "callbackURL": "https://dashboard.infrafund.net/?openfortAuthProviderUI=google",
  "disableRedirect": false
}
```

Both deployments are the same Next.js app (`front-pro`), same git branch, and resolve via Vercel:
- `dash-dev.infrafund.net` → `front-pro-git-develop-infrafunds-projects.vercel.app` (preview)
- `dashboard.infrafund.net` → `front-pro-lac.vercel.app` (production)

Both run with the same `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` — read from a single source (`src/lib/openfort-config.tsx:15`), and on Vercel the env var is configured with scope = *Production + Preview*, so the same value reaches both deployments. There is no per-environment override.

## Confirmed network observations

Captured from the Chrome DevTools Network tab on each domain (see `google-login-prod-403-investigation-2.md` for the raw capture):

**`https://dashboard.infrafund.net`** (fails)

- Request payload: `{"provider":"google","callbackURL":"https://dashboard.infrafund.net/?openfortAuthProviderUI=google","disableRedirect":false}`
- Response: `{"message":"Invalid callbackURL","code":"INVALID_CALLBACK_URL"}` (HTTP 403)
- Outcome: error shown in Openfort UI; flow does not proceed to Google

**`https://dash-dev.infrafund.net`** (works)

- Request payload: `{"provider":"google","callbackURL":"https://dash-dev.infrafund.net/?openfortAuthProviderUI=google","disableRedirect":false}`
- Response body: `Failed to load response data` in DevTools (the navigation continues, so the body is discarded)
- Outcome: browser proceeds to the Google sign-in screen

The two payloads are byte-identical except for the domain segment of `callbackURL`. Same trailing-slash-before-query shape on both.

## What we've ruled out

- **Web Origins (publishable key allowed origins).** Both `https://dash-dev.infrafund.net` and `https://dashboard.infrafund.net` are listed in the Openfort dashboard under *Configuration → Security → Web Origins* for the test key. Screenshot in `/home/sum/1_DATA/COMPANY-PROJECTS/InfraFund/Accounts/openfort/Infrafund/Infrafund_Openfort_Configuration_Security_Web Origins_photo_2026-05-06_19-29-34.jpg`. Web Origins gates *who can use the publishable key*; it is not what `INVALID_CALLBACK_URL` checks.
- **Google Cloud Console — Authorized JavaScript origins.** Both domains plus the apex `https://infrafund.net` are listed. Screenshot in `/home/sum/1_DATA/COMPANY-PROJECTS/InfraFund/Accounts/auth-Google/Infrafund.net/Infrafund.net_Google_Client-ID_Authorised-JavaScript-origins_photo_2026-05-06_19-36-26.jpg`. The error originates *before* Google is contacted, so this can't be the cause.
- **Trailing slash in registered URLs.** None of the registered Openfort entries have a trailing slash (verified in screenshot). The SDK's emitted `callbackURL` *does* end in `/?openfortAuthProviderUI=google`, but it does so identically on dev (which works) and prod (which fails) — so trailing-slash semantics are not the differentiator.
- **Different Openfort projects / clients.** Same publishable key on both = same Openfort project. The only way per-domain behavior could differ within one project is if there is a per-client (App Client) override — see "Open hypotheses" below.

## What the Openfort docs say

From `https://www.openfort.io/docs/configuration/configure-origins`:

> ## Allowed OAuth redirect URLs
>
> You can configure allowed OAuth redirect URLs to restrict where users can be redirected after they log in with an external OAuth provider. … To configure allowed OAuth redirect URLs, navigate to **Configuration → App settings → Advanced** on the dashboard.
>
> - The URL must be an exact match for the redirect URL.
> - The URL must be at a domain listed in allowed domains.
> - The protocol (`https`) is required.
> - Wildcards (`*`) are not supported.
> - **If no URLs are listed, users can be redirected to any URL.**

This list (separate from Web Origins) is the most likely source of `INVALID_CALLBACK_URL`. **However, the menu path "Configuration → App settings → Advanced" does not exist in the current Openfort dashboard UI.** Sven could not locate it.

## Behavioral contradiction with the docs

If the docs were strictly accurate, the **working** dev request should also fail, because its `callbackURL` contains the same `?openfortAuthProviderUI=google` query string and the same trailing-slash-before-query shape:

```text
https://dash-dev.infrafund.net/?openfortAuthProviderUI=google      ✅ accepted
https://dashboard.infrafund.net/?openfortAuthProviderUI=google     ❌ rejected
```

So one of the following must be true:

1. The matching logic ignores query params (and possibly trailing slashes) and compares on origin/path only — in which case the docs are misleading, and the prod domain is missing from a hidden allowlist.
2. The "empty list = allow any" branch is **not** what is happening here; the project has an allowlist that includes `dash-dev.infrafund.net` but not `dashboard.infrafund.net`.
3. There is a per-app-client override (Clients tab in the docs) that we cannot see in the current UI and that differs between the two domains somehow.

In all three cases the resolution is the same: add `https://dashboard.infrafund.net` to whatever list is being matched, or have Openfort confirm the matching rules.

## Open hypotheses

1. **Allowed OAuth redirect URLs list (renamed in current UI).** Most likely. The dashboard UI has been redesigned; the equivalent setting probably lives somewhere else (candidates: *Configuration → App settings → Clients tab*, *Authentication → providers → Google → Allowed callback URLs*, or under each app client's individual settings). If `dash-dev.infrafund.net` is on the list and `dashboard.infrafund.net` is not, that explains the dev-works/prod-fails split exactly.
2. **Per-app-client override.** Openfort docs reference a *Clients* tab where allowed origins / redirect URLs can be overridden per client. If the SDK on prod resolves to a different app client (e.g. via a different env var on the prod deployment), that client may have a stricter allowlist.
3. **Subtle prod-only difference in the request.** A Cloudflare or Vercel proxy quirk could be mangling the payload only on the prod domain — e.g., adding/stripping headers that Openfort's IAM v2 endpoint cares about. Less likely, but cheap to verify.

## Next steps

1. **Wait for Openfort response on [issue #276](https://github.com/openfort-xyz/openfort-js/issues/276).** Direct asks in the issue:
   - Where in the current dashboard is the equivalent of `Allowed OAuth redirect URLs`?
   - Confirm the actual matching rules used by `POST /iam/v2/auth/sign-in/social` for `callbackURL` — are query params and trailing slashes stripped before comparison, or is it strict exact-match as the docs say?
   - Check whether project `pro_fbe07139-...` has a non-empty allowlist that contains `dash-dev.infrafund.net` but not `dashboard.infrafund.net`.
   - Is the allowlist configurable via the public API if the dashboard no longer exposes it?
2. **Walk every menu in the Openfort dashboard sidebar** (in case we missed it), looking for any list of URLs other than Web Origins. Specifically check:
   - *Configuration → App settings → Clients* (per-client overrides)
   - *Authentication* / *Auth providers* / Google provider settings
   - Any "Allowed callback URLs" or "Redirect URIs" field
   Add `https://dashboard.infrafund.net` to anything that looks similar.
3. **Capture full request headers** on both domains (`Origin`, `Referer`, `x-openfort-*`, any Cloudflare/Vercel-injected headers) — rules out the "subtle prod-only difference" hypothesis. Browser-control via `chrome-devtools-mcp` was attempted but the connection is currently flaky; see `~/1_DATA/.../Chrome DevTools MCP/ChromeDevTools-setup-quickstart.md`. The payload bodies are already confirmed identical (see "Confirmed network observations" above); headers are the remaining unknown.
4. **Cross-reference open issues** in `openfort-xyz/openfort-js`: #275 (iframe `referrerpolicy` / embed 403) and #272 (Shield `NoSecretFoundError`) are nearby in symptom but happen *after* auth — not the same root cause.

## Reference files

- Upstream issue: https://github.com/openfort-xyz/openfort-js/issues/276
- Raw network capture: `docs-dev/openfort/google-login-prod-403-investigation-2.md`
- App config wiring `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY`: `src/lib/openfort-config.tsx:15`
- Openfort security screenshot: `/home/sum/1_DATA/COMPANY-PROJECTS/InfraFund/Accounts/openfort/Infrafund/Infrafund_Openfort_Configuration_Security_Web Origins_photo_2026-05-06_19-29-34.jpg`
- Google origins screenshot: `/home/sum/1_DATA/COMPANY-PROJECTS/InfraFund/Accounts/auth-Google/Infrafund.net/Infrafund.net_Google_Client-ID_Authorised-JavaScript-origins_photo_2026-05-06_19-36-26.jpg`
- Openfort dashboard URL (test mode, Security tab): `https://dashboard.openfort.io/pro_fbe07139-a184-41fd-8b55-bbe383bcf826/test/security`
- Google authorized redirect URI configured for the Openfort callback: `https://api.openfort.io/iam/v2/auth/callback/google`
