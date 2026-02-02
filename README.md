# TabScape

Prototype dashboard for tracking tabs, forecasting obligations, and planning pay cycles.

## Highlights
- Tabs, transactions, receipts, tags, rules, and forecasts
- Shared expenses with roommate splits + paid/partial tracking
- Payday plan with envelopes, buffers, and multiple income schedules
- Preferences for layout, currency, location, and theme
- Notifications for limit warnings

## Tech
- Next.js App Router
- Prisma + PostgreSQL

## Local Setup
1) Install dependencies:
```bash
npm install
```

2) Create a local Postgres database:
```bash
createdb tabscape
```

3) Set environment variables:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tabscape?schema=public"
```

4) Run migrations and generate Prisma client:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5) Start the dev server:
```bash
npm run dev
```

6) Seed demo data:
- Visit `/api/seed` once in the browser.

## Demo Login
- Email: `demo@tabscape.local`
- Password: `demo123`

## Notes
- This is a prototype. Auth is demo-only and not secure.
- Data lives in your local Postgres database.
