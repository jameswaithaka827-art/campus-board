# James AI 1.4 — Product Blueprint

## Product promise
One secure student ecosystem for learning, teaching, collaboration and campus services.

## Roles
- Student: AI Tutor, courses, notes, planner, exams, community, study matching, marketplace and savings.
- Lecturer: Teaching Studio, courses, lessons, assignments, live classes, student progress and AI-assisted preparation.
- Admin: identity verification, users, moderation, security, subscriptions, payments and platform health.

## Trust flow
Google authentication → verified email code → strong password → school/staff verification when required → role-based access → auditability.

## Payments architecture
- Web: Stripe and M-PESA/Daraja adapters.
- Android: Google Play Billing for digital in-app Pro entitlement where required.
- iOS: StoreKit for digital in-app Pro entitlement where required.
- Server database is the source of truth for entitlement after provider verification.
- KukuPay remains an adapter placeholder until the exact provider/API is confirmed.

## Learning
- Course workspace with lessons, teaching notes, assignments, quizzes and live classes.
- AI Teaching Assistant prepares drafts; lecturer approves before publishing.
- Recorded video can use YouTube embeds; live class can use Zoom Video SDK.

## Community
- School-verified academic identity.
- Feed: notes, projects, questions and resources.
- Likes, comments, views, shares and study-room discussions.
- Matching is explicitly for academic collaboration, with block/report controls.

## Campus services
- CampusMarket is a configured external service until its source is integrated.
- Savings is a configured integration point until its source is provided.

## Launch discipline
This package is a release-candidate development baseline until a real environment passes dependency install, production build, database migration, OAuth/email/payment tests, browser/device E2E tests and store-specific checks.
