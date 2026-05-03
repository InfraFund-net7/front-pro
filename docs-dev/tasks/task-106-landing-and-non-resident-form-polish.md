<!-- cspell:words Openfort openfort recaptcha viem -->

# Task 106: Landing copy + non-resident form polish (country list, dropdown portal, captcha diagnostics, required-field hints)

**Status:** Done
**Target repo:** `front-pro`
**Depends on:** task-103, task-104, task-105 (auth/UX baseline)
**Related:** `docs-dev/tasks/task-105-avatar-dropdown-menu.md`

## Issues addressed

1. **Landing copy** — button label and description text were generic; updated
   to "Login / Register" with a two-line description.
2. **Non-resident contact form ordering** — Country before Email made the
   country-picker the most prominent field; the user expects Email first.
3. **Country dropdown clipped inside modal** — the custom `Dropdown` rendered
   its menu as an absolute child of the trigger, so it was constrained by the
   modal's bounding box.
4. **Country list silently truncated to 10** — the `/api/v1/locations/countries`
   endpoint defaults to `limit: 10` and capped at 100; the client never
   overrode the default, so the dropdown showed only the first 10 ISO
   countries (out of ~250).
5. **Captcha "Captcha verification failed" with no diagnostics** — the server
   discarded Google reCAPTCHA's `error-codes`, making it impossible to tell
   apart a bad key, a domain mismatch, an expired token, or a browser-side
   problem.
6. **Required first/last name fields have no visual cue when empty** — users
   can't tell why the submit button is disabled.

## Changes

- `src/app/page.tsx` — landing description split into two lines via `<br />`;
  button label changed to `"Login / Register"`. `Login` component's
  `description` prop loosened from `string` to `ReactNode`.
  (`src/components/auth/login.tsx`)
- `src/components/auth/non-resident-form.tsx` — Email field moved above
  Country. First/Last Name (individual) and Contact Full Name + Company Name
  (organization) now show a red border when empty.
- `src/components/ui/form-input.tsx` — new `invalid?: boolean` prop adds a
  red border + `aria-invalid` attribute.
- `src/components/ui/dropdown.tsx` — menu now renders in a React portal
  (`createPortal` to `document.body`) with `position: fixed` coordinates
  computed from the trigger's `getBoundingClientRect`, recalculated on
  scroll/resize while open. Click-outside detection updated to check both
  the trigger and the portal'd menu. Esc dismisses.
- `src/app/api/v1/locations/countries/route.ts` — `limit` cap raised from
  100 to 300 (we have ~250 ISO countries; default 10 unchanged for paginated
  callers).
- `src/lib/backend-auth-client.ts` — `getCountries()` now requests
  `?limit=300` so the dropdown gets the full list. Error-message merge:
  when both `message` and `detail` are present in an API error response,
  show them together (`"<message> — <detail>"`).
- `src/server/http/captcha.ts` — log Google's reCAPTCHA `error-codes` via
  pino, and surface them in the `detail` field of the API error in
  non-production.

## Notes

- "browser-error" from reCAPTCHA's verify endpoint in dev was traced to the
  `localhost` hostname missing from the reCAPTCHA admin's Domains list
  (Google ignores port). Adding it fixed verification immediately. No
  app-side change needed for that specific cause; the diagnostic improvement
  in `captcha.ts` is what surfaced the root cause and will help future
  debugging.

## Verification

1. `npm run dev:local`, open via a clean browser.
2. Landing page shows the new copy with the line break.
3. Non-resident contact form: Email above Country. First/Last Name fields
   have a red border when empty; the border disappears as you type.
4. Click the country dropdown — full ~250-country list, scrollable inside
   the dropdown, popover escapes the modal bounds.
5. Submit the form with empty required fields — Notify me button stays
   disabled (existing behaviour).
6. `npm run format` (eslint + prettier + cspell + knip) — pass.
7. `npm run build` — pass.

## Out of scope

- Country search-as-you-type inside the dropdown (raised by user during
  testing; deferred — would need a typeahead variant of `Dropdown`).
- Form-level submit-time validation messaging (current behaviour relies on
  disabled-button guard, which is fine for a simple contact form).
