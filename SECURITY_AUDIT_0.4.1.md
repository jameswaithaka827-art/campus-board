# James AI v0.4.1 — Authentication & Security Upgrade

## Main changes
- New accounts are Google-verified first.
- Only `@gmail.com` and administrator-approved Google Workspace domains are accepted.
- Workspace users must present the matching Google `hd` claim.
- Google OAuth stable `sub` is stored as `googleId`; email is not used as the identity key.
- Existing Google links are protected against account-link confusion.
- Google-created accounts start with the `student` role. Lecturer role changes require an approved institutional domain.
- New users are required to create a strong backup password after Google verification.
- Passwords require 14–128 characters, upper/lowercase, a number, and a symbol.
- The app can generate a random strong password in the browser using `crypto.getRandomValues`.
- Password hashes now use bcrypt cost 12 for newly-created passwords.
- Suspended/inactive accounts are blocked at sign-in/session refresh.
- Added session-version/account-status fields for future server-side session revocation hardening.
- Added missing `timeZone` and `chatUsageMonth` Prisma fields used by the existing application.
- Lecturer role is gated by an environment-configured institution domain.
- Authentication UI was redesigned to feel more like a modern app.

## Important limitation
Google can verify that an account is a Gmail account or an approved Google Workspace account, but there is no meaningful public notion of a "clean Gmail" beyond identity/authentication signals. The implementation therefore uses Google's verified email claim, stable account `sub`, and domain rules.

## Required environment
`GOOGLE_ALLOWED_DOMAINS=gmail.com,zetech.ac.ke`
`LECTURER_ALLOWED_DOMAINS=zetech.ac.ke`

## Deployment checklist
- Set the real Google OAuth client ID/secret server-side.
- Register exact local and production redirect URIs with Google.
- Keep `NEXTAUTH_SECRET` private and random.
- Keep AI, Stripe, Blob, and database secrets server-only.
- Replace process-local rate limiting with a shared distributed limiter before a large production launch.
- Run `npx prisma generate` and `npx prisma db push`.
- Run `npm install` and `npm run build` locally.

## Additional hardening in this pass
- Existing-password changes require the current password.
- Password changes increment a session version so older JWT sessions are rejected on the next session refresh.
- The lecturer role endpoint returns an explicit error instead of silently accepting unauthorized role changes.
