# InfraFund Front Pro

Single Next.js app for the InfraFund frontend and migrated backend API routes.

## Quick start

```sh
npm install
cp .env.example .env.local
npm run dev:local
```

Open `http://localhost:3000`.

## Common commands

```sh
npm run dev              # Start Next.js only
npm run dev:local        # Start local Postgres, sync schema, seed data, and run dev server
npm run db:local:setup   # Start/sync/seed local Postgres only
npm run db:local:down    # Stop local Postgres
npm run env:example      # Regenerate sanitized .env.example from .env.local
npm run build            # Production build
```

Dev server output from `npm run dev:local` is mirrored to `.next/dev-server.log`.

## References

- Environment variables: `config-operation/environment-variables.md`
- Local setup and manual testing: `docs-dev/test/local-testing-runbook.md`
- Backend migration plan: `docs-dev/tasks/task-100-nextjs-migration-plan.md`
