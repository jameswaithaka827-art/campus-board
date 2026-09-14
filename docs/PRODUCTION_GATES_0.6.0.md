# James AI v0.6.0 — Production gates

Before public launch, all gates should pass:

1. `npm install` succeeds.
2. `npm run db:push` succeeds against a test database.
3. `npm run test:security` passes.
4. `npm run test:smoke` passes.
5. `tsc --noEmit` passes.
6. `npm run build` passes.
7. Authorization tests confirm one user cannot read or mutate another user's data.
8. Admin tests confirm role/status changes revoke sessions.
9. Account-deletion tests confirm database rows and stored avatar are removed.
10. Store package tests are completed separately for Android/iOS; web Stripe checkout is not reused blindly for native digital subscriptions. Google Play requires its billing system for Play-distributed digital subscriptions unless a policy exception applies; Apple uses In-App Purchase for auto-renewable subscriptions.

This document is a release gate, not a store approval.
