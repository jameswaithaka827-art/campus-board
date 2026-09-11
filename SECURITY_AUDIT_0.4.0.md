# James AI v0.4.0 — Security Audit Notes

## Improved in this revision
- Google OAuth 2.0 sign-in through NextAuth.
- Google `email_verified` is required before account creation/linking.
- Google subject (`googleId`) is stored uniquely.
- Existing password accounts can be linked only through the same verified Google email.
- Mismatched Google identity/email links are rejected instead of silently overwritten.
- Password hash is nullable for Google-only accounts.
- Credential login uses a bcrypt dummy hash for unknown users to reduce timing-based email enumeration.
- Credential login is rate limited by normalized email.
- 30-day JWT session maximum age is configured.
- Baseline browser security headers are sent by middleware.
- Production HSTS is enabled by middleware.
- Existing API routes continue to scope database queries by `session.user.id`.

## Not yet production-complete
- Rate limiting is process-local and must become distributed/shared for multi-instance serverless deployment.
- Password accounts still need a proper email-verification flow.
- Password reset and session revocation are not implemented yet.
- Security/audit event persistence and alerting are not implemented yet.
- Automated IDOR/authorization tests are not implemented yet.
- Uploads should receive deeper content/magic-byte validation before accepting arbitrary user files.
- Dependency/secret scanning and a final external security review are still required for a public launch.

## Verification limitation
`npm install` could not finish in the sandbox because package installation timed out. Therefore a complete production build could not be honestly claimed as verified here.
