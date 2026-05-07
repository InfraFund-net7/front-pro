<!-- cspell:words Ourcome -->

# Debugging data 

I has a working openfort setup using my (this) account and deployed it on vercel with domain openfort.infrafund.net - everything was fine.

Then I moved the whole vercel project to Infrafund's company vercel account and just replacing the openfort public and private keys in the vercel env vars settings - which are set to cover preview and production deployment (so they are identical).

We setup these domains for dev/preview and production within vercel and also these domains are added to openfort:
https://dash-dev.infrafund.net
https://dashboard.infrafund.net

While the "login with google" works for dash-dev, if fails right away for `dashboard`with
{"message":"Invalid callbackURL","code":"INVALID_CALLBACK_URL"}

As we want to move from Particle to openfort we would need to resolve this quickly to make it happen.

Openfort presents the popup, we chose login with google

## https://dashboard.infrafund.net/

### Request Payload

{"provider":"google","callbackURL":"https://dashboard.infrafund.net/?openfortAuthProviderUI=google","disableRedirect":false}

### Response for dashboard sub-domain

{"message":"Invalid callbackURL","code":"INVALID_CALLBACK_URL"}

### Ourcome

gives and error

## https://dash-dev.infrafund.net

### Payload

{"provider":"google","callbackURL":"https://dash-dev.infrafund.net/?openfortAuthProviderUI=google","disableRedirect":false}

### Response for dash-dev subdomain


`Failed to load response data`

### Outcome 

works and moving on to ask user to login to google

## Github Issue

<https://github.com/openfort-xyz/openfort-js/issues/276>
