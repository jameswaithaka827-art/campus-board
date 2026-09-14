# James AI v0.7.0 — Student Network + Marketplace

Preserves the existing James AI structure and adds a study-first student ecosystem.

## Added
- Student Community workspace.
- Study profile and opt-in matching by course, year, study interests, sports/activities and study mode.
- Live study rooms with in-app chat and online heartbeat.
- Connection requests, accepted connections, blocking and reporting.
- Admin review endpoint for open community reports.
- Student Marketplace with listing creation and discovery.
- Dashboard navigation entries for Community and Marketplace.
- Additional security/smoke regression checks.

## Safety/product rules
- Matching is for academic/community connection, not dating.
- Exact location and phone numbers are not used for matching.
- Users can opt out, block and report.
- Message and connection creation are rate limited.

## Verification status
Static source checks were added for the new features. A complete npm install, production build and real-device/browser test still must be run in a clean environment before public release.
