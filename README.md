# James AI 1.4.0

Student learning ecosystem: AI Tutor, courses, community, verified identities, Teaching Studio, Admin Center and campus services.

## First local setup
```cmd
npm install
npx prisma generate
npx prisma db push
npm run test:all
npm run build
npm run dev
```

## Important
Copy `.env.example` to `.env.local` and provide only real secrets locally. Never commit `.env.local`.

## Presentation
Open `/demo` for a safe presentation flow.

## Integrations
- CampusMarket: `MARKETPLACE_URL` until source-level integration.
- Savings: `SAVINGS_APP_URL` until source-level integration.
- M-PESA: set Daraja variables to enable STK Push.
- Zoom: set Video SDK credentials to enable the token endpoint.
- Stripe: existing web subscription flow.
# James AI — 1.1.0 Clean Baseline

James AI is a student-first education workspace combining AI study help, planning, notes, courses, live teaching, verified student community, study-partner matching, a marketplace, and role-based administration, with connected CampusMarket access and a savings integration point.

## Showcase
Open `demo/james-ai-demo.html` directly in a browser for a presentation-only visual demo. It uses mock data and requires no database or API keys.

## Core roles
- Student: AI tutor, courses, notes, planner, exams, community, study rooms, matching, marketplace.
- Lecturer/Teacher: Teaching Studio for courses, lessons, teaching notes and live-class scheduling.
- Admin: user management, school-ID verification, community moderation, audit/security activity and system controls.

## Security foundation
Google sign-in, email verification codes, strong passwords, password reset, session-version revocation, school-ID verification, role checks, rate limiting, protected admin routes, security events and account deletion are included.

## Important
This repository is a release candidate, not a security certification. Before public launch, run dependency installation, `npx prisma generate`, database migration/push, `npm run build`, browser/E2E tests, real database tests, mobile/device tests, production secret configuration, and store-specific compliance review.

## Local setup
1. Copy `.env.example` to `.env.local` and supply real secrets.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npx prisma db push` for local SQLite development.
5. Run `npm run dev`.
6. Open `http://localhost:3000/demo` first for the presentation mode, then `/signup` for the real authentication flow.
7. `MARKETPLACE_URL` points to the current CampusMarket app; set `SAVINGS_APP_URL` when you provide the savings project.

## Audits
- `npm run test:security`
- `npm run test:community`
- `npm run test:smoke`
- `node scripts/release-audit.js`
- `npm run test:all`
