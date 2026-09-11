# Merge & Bug-Fix Pass — v1.4.5 (cost-optimized branch)

Merged the marketplace port and all established fixes into this branch,
and added login two-factor authentication. This branch had already
absorbed most previous fixes (gym role, FREE_MODE, nodemailer, requireAdmin,
maxImages, Date|String) — only the marketplace port, M-Pesa fixes, and one
real mistake I need to own up to were actually missing.

## A mistake I made and caught during this pass
I initially copied an old email/password signup form onto this branch's
signup page, based on a flawed assumption from diffing file contents. This
branch (and your last two deliverables, which I double-checked) actually
use **Google-only account creation by design** — `/api/signup` intentionally
returns a 403 telling people to use Google, and the real signup page never
had a password field. I caught this before finishing the pass and restored
the correct page. Flagging it here rather than quietly fixing it, since
transparency matters more than looking clean.

## What "cost-optimized" actually changed (and one bug in it)
- Model bumped to `claude-sonnet-5` (current as of this pass).
- Added Anthropic prompt caching — but **`cache_control` was placed as a
  top-level parameter to `messages.create()`, which doesn't exist in the
  API.** Caching only activates when `cache_control` is attached to a
  specific content block; a bare top-level field is either a type error or
  silently ignored, meaning **no caching was actually happening** despite
  the detailed comment explaining the intended savings. Fixed by moving it
  onto the system prompt's content block, which is exactly what the
  original comment described wanting.

## A real fix worth highlighting: private file storage
This branch properly adopted `@vercel/blob@2.8.0`'s genuine private-access
support (GA since June 2026) — a separate private store, real
authentication on every read, not just an unguessable URL. This **replaces
a limitation I'd flagged in every previous merge pass** (Vercel Blob used
to only support public blobs). School ID documents and community post
images are now actually private. Nothing to fix here — just confirmed it's
correctly implemented and left it alone.

## New: two-factor login (as requested)
Password-based login now requires a second factor — Google login is
unaffected, since Google's own auth is already strong; this specifically
hardens the weaker password path:
1. Correct email + password → a 6-digit code is emailed (or printed to
   your terminal if SMTP isn't configured yet, same dev-fallback pattern
   used elsewhere).
2. The login page switches to a code-entry step. Wrong password never
   reaches this stage — no code is sent unless the password checks out
   first, so no signal is leaked to a wrong-password attempt.
3. Code must match, not be expired (10 min), and not already be used.
   5 wrong attempts locks that code (matching the existing signup-code
   pattern exactly). A "resend code" option is rate-limited separately.

New model: `LoginVerificationCode` — deliberately separate from
`EmailVerificationCode` so a pending login code can never be confused with
account-verification state. New file: `lib/login-verification.ts`.

## Marketplace ported to this branch
Same Stage 1 work as before (9 categories, category-specific fields,
multi-image listings, watchlist, reporting) — this branch still had the
original 44-line stub. Kept marketplace images on public storage (not the
new private-blob system) since listing photos are meant to be browsable
without extra auth friction, unlike ID documents or community posts.

## M-Pesa fixes reapplied
Same two bugs as previous branches: the STK-push route's origin check was
dead code (wrapped in a try/catch around a function that never throws),
and the callback had no independent verification against Safaricom before
trusting a claimed payment result. Both fixed, matching the earlier passes.

## Verification performed
- Fresh `npm install` — resolved cleanly.
- `npx tsc --noEmit` — zero errors.
- `npm run build` — compiles, lints, and type-checks clean. Fails only at
  the final "collect page data" step because this sandbox's network blocks
  Prisma's binary server (confirmed by checking for the missing `.node`
  engine file directly) — not a code issue.
- Full sweep across the whole codebase for every bug pattern found across
  every merge pass so far — confirmed no other instances remain.

## Before you install
Add to your `.env.local` on top of the existing checklist:
- `BLOB_PRIVATE_READ_WRITE_TOKEN` — from a **second, private-access** Blob
  store in Vercel's dashboard (can't share the token with your existing
  public avatar store — Vercel fixes access mode per store at creation).
- The 2FA code needs SMTP configured to actually email codes to real users;
  without it, codes print to your terminal (fine for local testing, not for
  real users going through password login).
