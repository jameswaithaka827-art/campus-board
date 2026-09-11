# James AI v0.4.2 — Verification + Admin

## New authentication flow
1. New user chooses Continue with Google.
2. Google authenticates the account and James AI checks `email_verified` plus the configured allowed domain policy.
3. James AI creates the account as `pending_verification`.
4. A one-time 6-digit code is sent to that same email address.
5. The user enters the code at `/account/verify-email`.
6. Only after a correct, unexpired code does the account become `active`.
7. The user then completes the strong backup password setup already present in v0.4.1.

Codes are HMAC-hashed in the database, expire after 10 minutes, have five attempts, and have a 60-second resend cooldown.

## Email delivery
Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally `SMTP_FROM`. The recipient can be Gmail or an approved Google Workspace address.

## Admin
After your verified account exists, run:

```bash
npm run admin:promote -- your-verified-email@gmail.com
```

Then sign out/in again and open `/admin`. The admin control center shows user counts, search, role management, account activation/suspension, and an audit log.

Do not put an admin email/password in frontend code. Admin authority is stored as a database role and every admin API checks the current session server-side.

## Production
For multi-user production, use managed Postgres and a shared rate-limit/store. Email delivery should use a transactional provider or properly secured SMTP credentials.

## Verification semantics
The one-time email code is required when a new account is first established after Google authentication. It is not sent on every ordinary page open; doing that would turn normal navigation into repeated OTP challenges. The account remains blocked from the dashboard until the code is verified.


## Admin safety
- Admin APIs always re-check the signed-in user's database role and active status.
- An administrator cannot suspend, deactivate, or change their own role through the admin UI.
- A pending/unverified user cannot be activated by the admin endpoint.
- Admin role can only be assigned to an active account.
