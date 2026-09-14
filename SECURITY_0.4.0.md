# James AI v0.4.0 — Security Foundation + Google Sign-In

## What changed
- Added optional Google OAuth 2.0 sign-in through NextAuth.
- Requires Google's email to be verified before creating or linking a James AI account.
- Existing password accounts can be linked to the same verified Google email.
- Google-only accounts use a nullable password hash instead of storing a fake password.
- Added a stable `googleId` to the user record.
- Added `emailVerifiedAt` to track verified identity from Google.
- Credential login keeps a bcrypt dummy-hash path for unknown users and now has a tighter per-email login rate limit.
- Added security response headers: CSP, HSTS in production, clickjacking protection, MIME sniffing protection, referrer policy, and permissions policy.
- Added a visible “Continue with Google” control to the login and signup flows.
- Google is optional until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured.

## Database change
Run:
`npx prisma db push`

The User model changes are:
- `passwordHash String?`
- `googleId String? @unique`
- `emailVerifiedAt DateTime?`

## Google Cloud setup
Create an OAuth 2.0 Client of type Web application.

Local callback:
`http://localhost:3000/api/auth/callback/google`

Production callback:
`https://YOUR-DOMAIN/api/auth/callback/google`

Google requires redirect URIs to match the registered value exactly. Keep the client secret server-side and out of GitHub/client bundles.

## What is still needed for high-assurance production security
This is a security foundation, not a claim that the app is invulnerable. Before public launch, add:
- shared/distributed rate limiting for Vercel/serverless,
- email verification for password accounts,
- password reset with single-use expiring tokens,
- account/session revocation,
- audit/security event logging,
- automated authorization/IDOR tests for every user-owned resource,
- dependency and secret scanning,
- database backups and recovery testing,
- production HTTPS/domain checks,
- file-content/magic-byte validation for uploads,
- external security review before storing sensitive student data at scale.
