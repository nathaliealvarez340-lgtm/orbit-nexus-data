# Orbit Nexus Deployment Guide

## Audit Summary

Orbit Nexus is **not compatible with static export**.

This project depends on:

- App Router route handlers under [C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\api](C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\api)
- JWT/cookie authentication and protected server-rendered routes
- Prisma with a real database connection
- Dynamic App Router pages such as:
  - [C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\(protected)\workspace\projects\[projectSlug]\page.tsx](C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\(protected)\workspace\projects\[projectSlug]\page.tsx)
  - [C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\(protected)\workspace\actions\[actionSlug]\page.tsx](C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\(protected)\workspace\actions\[actionSlug]\page.tsx)
  - [C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\activation\success\page.tsx](C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\app\activation\success\page.tsx)
- Stripe checkout + webhook processing

Because of that, deploy Orbit Nexus as a **Node.js server app**, not as a static site.

## Recommended Option

**Recommended:** Vercel

Why:

- Next.js is zero-config on Vercel
- Managed HTTPS is built in
- Route handlers, App Router, Prisma, and dynamic rendering fit naturally
- Stripe webhooks are easier to expose securely on a public HTTPS domain

**Alternative:** Hostinger Node.js Web App or VPS

Use Hostinger only if you deploy it as a real Node.js application. Do **not** use standard static/shared hosting for this repo.

## Environment Variables

Set these variables before the first public deployment.

### Required

- `DATABASE_URL`
  - Production must point to PostgreSQL, not `file:...`
- `JWT_SECRET`
- `APP_URL`
  - Production value for Orbit Nexus: `https://orbitne.com`
- `SUPERADMIN_MASTER_CODE`

### Required for full commercial checkout

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Required for email recovery in production

- `RESEND_API_KEY`
- `MAIL_FROM`
  - Recommended: `soporte@orbitne.com`

### Seed / admin / demo configuration

- `DEFAULT_COMPANY_NAME`
- `DEFAULT_COMPANY_SLUG`
- `DEFAULT_COMPANY_CODE_PREFIX`
- `DEFAULT_COMPANY_REGISTRATION_CODE`
- `SUPERADMIN_NAME`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PHONE`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_ACCESS_CODE`
- `SEED_LEADER_ACCESS_CODE`
- `SEED_LEADER_PASSWORD`
- `SEED_CONSULTANT_ACCESS_CODE`
- `SEED_CONSULTANT_PASSWORD`
- `SEED_DEMO_PROJECT`
- `DEMO_PROJECT_FOLIO`

Reference template:

- [C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\.env.example](C:\Users\Nathalie_Gar\OneDrive\Documentos\orbit-nexus-data\.env.example)

## Commands

### Install command

```bash
npm install
```

### Build command

```bash
npm run build
```

### Start command

```bash
npm run start
```

### Prisma migrations

```bash
npx prisma migrate deploy
```

### Optional seed

```bash
npx prisma db seed
```

## Vercel Deployment

Official references:

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)

### Steps

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Vercel, create a new project and import the repository.
3. Keep the detected framework as **Next.js**.
4. Configure these values in Vercel:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty/default
5. Add all required environment variables in Vercel Project Settings.
6. For production, set:
   - `APP_URL=https://orbitne.com`
7. Attach the custom domain `orbitne.com` in Vercel Domains and let HTTPS provision automatically.
8. Run database migrations against the production database:

```bash
npx prisma migrate deploy
```

9. If you need baseline data, run:

```bash
npx prisma db seed
```

10. Deploy production:

```bash
vercel --prod
```

11. In Stripe, point the webhook endpoint to:

```text
https://orbitne.com/api/stripe/webhook
```

### Notes

- Vercel already handles the public HTTPS edge layer.
- `npm run build` now validates critical variables before compiling.
- Preview deployments can fall back to Vercel-provided URLs if `APP_URL` is not set there.

## Hostinger Node.js Web App Deployment

Official references:

- [Hostinger: deploy a Node.js Web App](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger: redeploy a Node.js application](https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)

### When Hostinger is valid

Use Hostinger only if you are deploying to:

- **Hostinger Node.js Web App**
- or a **Hostinger VPS**

Do **not** deploy this repo to static hosting, shared HTML hosting, or any mode that expects `next export`.

### Steps with Hostinger Node.js Web App

1. In hPanel, go to **Websites** and click **Add Website**.
2. Choose **Node.js Apps**.
3. Import from GitHub or upload the project files.
4. Let Hostinger detect **Next.js** automatically.
5. Use:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
6. Add the same production environment variables used on Vercel.
7. Set:
   - `APP_URL=https://orbitne.com`
8. Run production migrations against the production database before public launch:

```bash
npx prisma migrate deploy
```

9. Optional seed:

```bash
npx prisma db seed
```

10. Redeploy from the Hostinger dashboard after any env or build setting change.
11. Confirm the public domain has valid SSL and points to the Node.js app.
12. Configure Stripe webhook to:

```text
https://orbitne.com/api/stripe/webhook
```

### Hostinger-specific caution

If Hostinger does **not** properly detect this repo as a server-side Next.js app and falls back to a generic static flow, stop there and use Vercel or a VPS instead.

## Compatibility Notes

### Compatible

- Vercel
- Any Node.js host that supports `next build` + `next start`
- Hostinger Node.js Web App
- VPS with Node.js 20+ and reverse proxy/HTTPS

### Not compatible

- `next export`
- Static-only hosting
- Shared hosting that cannot run a Node.js server
- SQLite-based public production storage

## Production Checklist

- `DATABASE_URL` points to PostgreSQL
- `APP_URL=https://orbitne.com`
- `JWT_SECRET` is strong and unique
- `SUPERADMIN_MASTER_CODE` is set
- Stripe variables are set if checkout must work publicly
- `RESEND_API_KEY` is set if recovery emails must send publicly
- `npx prisma migrate deploy` completed successfully
- `npm run build` completed successfully
- Public domain resolves with valid HTTPS
- Stripe webhook points to `/api/stripe/webhook`

## Recommendation

For Orbit Nexus, **Vercel is the recommended production target**.

It is the cleanest fit for:

- App Router
- route handlers
- auth + cookies
- Prisma-backed dynamic pages
- public HTTPS
- Stripe checkout/webhook flows

Use Hostinger only if you specifically need their Node.js Web App environment and you confirm the project is running as a true server-side Next.js deployment.
