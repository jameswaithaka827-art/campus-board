# James AI v1.2.0 — Product Polish & Presentation Upgrade

## Goal
Turn the existing James AI architecture into a clearer, more impressive pre-install baseline without changing the core navigation or waiting on CampusMarket/Savings source integration.

## Added
- Dedicated AI Tutor route with focused study affordances.
- Reworked student dashboard with daily timetable summary, seven-day study-hours snapshot, better quick actions, and clearer Pro positioning.
- Polished landing page centered on the student ecosystem story.
- Improved visual system: hero surfaces, stat cards, feature cards, verified pill, focus-visible controls.
- Marketplace remains connected through `MARKETPLACE_URL`.
- Savings remains a safe integration point until the user's real savings source is provided.
- Existing learning, community, school verification, lecturer studio, admin, Pro, PWA, security and privacy foundations remain included.

## Verification
- Source inventory reviewed after upgrade.
- Duplicate/temporary files not intentionally added to the runtime surface.
- TypeScript/TSX parsing check performed on changed application source.
- Existing security/community/release smoke audits rerun after packaging.

## Remaining release gates
- Full dependency installation and production build in a normal networked environment.
- Real browser E2E testing.
- Production PostgreSQL migration/testing.
- Native Android/iOS billing and store submission testing.
- Final legal/privacy review before public launch.
