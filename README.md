# App Short Link

## Cloudflare Pages + Prisma Accelerate

This project is configured for:
- Frontend: React + Vite
- Backend: Cloudflare Pages Functions (`functions/`)
- Database access in runtime: Prisma Accelerate (`DATABASE_URL=prisma://...`)

### Required environment variables

- `DATABASE_URL`: Prisma Accelerate connection string (`prisma://...`) for runtime queries.
- `DIRECT_URL`: Direct Supabase/Postgres connection string (`postgresql://...`) for Prisma CLI and bootstrap scripts.
- `JWT_SECRET`: Secret used to sign/verify auth tokens.
- `RESEND_API_KEY`: Resend API key for verification and reset emails.
- `DOMAIN`: Public app URL used to generate email links.

## Build

```bash
npm ci
npx prisma generate
npm run build
```

## Auth endpoints

- `POST /api/auth/register`
- `GET /api/auth/verify?token=...`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Bootstrap initial admin owner

> Safety guard: this command **will not run** unless `BOOTSTRAP_OWNER_ENABLED=true` is set.

1. Set these variables (example values shown):

```bash
export DIRECT_URL="postgresql://postgres:password@db.example.supabase.co:5432/postgres"
export BOOTSTRAP_OWNER_ENABLED="true"
export BOOTSTRAP_OWNER_EMAIL="owner@example.com"
export BOOTSTRAP_OWNER_PASSWORD="ChangeMe123!"
export BOOTSTRAP_OWNER_NAME="Initial Owner"
```

2. Run bootstrap:

```bash
npm run bootstrap:owner
```

This upserts an `ADMIN` user with `ACTIVE` status and ensures a default workspace exists.
