# James AI v0.6.0 — Showcase + Security Hardening

## Major improvements
- Password reset by short-lived, single-use email token.
- Session revocation on admin account suspension/activation/role changes and password changes.
- Account deletion cleans profile avatar storage when Vercel Blob is configured.
- Same-origin checks added to high-impact state-changing API routes.
- SecurityEvent model/logger for auditable security events.
- Public presentation route at `/demo` for lecturers, VC/leadership and student demos without exposing real user data.
- Stronger dashboard/mobile presentation polish.
- CSP allows controlled future Zoom embedding/WebSocket transport.

## Test status
- Static security audit: run with `npm run test:security`.
- Smoke audit: run with `npm run test:smoke`.
- TypeScript compiler check can be run locally with `tsc --noEmit`; full dependency/build checks still require `npm install` on a normal networked machine.
