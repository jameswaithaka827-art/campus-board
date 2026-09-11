# James AI — Store Readiness Review (2026-09-05)

## Current assessment
Web/PWA foundation: READY FOR INTERNAL TESTING, not store submission.
Native Android/iOS packages: NOT YET BUILT.

## Google Play
Before production: complete Play Console developer/account verification, privacy policy, Data Safety, account-deletion flow, content declarations, store listing and testing. For new personal developer accounts created after 13 Nov 2023, Google requires a closed test with at least 12 opted-in testers continuously for 14 days before production access.
Digital subscriptions/features in a Play-distributed Android app should use Google Play Billing unless an applicable policy exception/program applies.

## Apple App Store
Before submission: Apple Developer membership, privacy policy, account deletion, App Store Connect metadata, review notes/test account where required, and native purchase integration for digital subscriptions. If Google/social sign-in is used as the primary account login, review Apple's current equivalent-login requirement and applicable education/enterprise exception before submission.

## James AI implementation
- PWA manifest and 192/512 icons are prepared.
- In-app account deletion exists plus a public deletion page path.
- Privacy and Terms pages exist as placeholders and MUST be replaced with your real legal/support details before production.
- Website Pro checkout remains Stripe.
- Native store billing is not wired yet.
- Zoom Video SDK is not embedded yet; current live classes store provider/join-link data.
- YouTube video embeds can use the official IFrame Player API.

## Release blockers still open
1. Run a real production build and end-to-end tests.
2. Move public deployment database from local SQLite to managed PostgreSQL.
3. Replace in-memory rate limiting with shared/distributed rate limiting.
4. Add password reset, session/device management, 2FA/passkeys where appropriate.
5. Complete native Android/iOS packaging and store-specific billing.
6. Replace placeholder legal/support content.
7. Perform a final security/privacy review.
