# Merge & Bug-Fix Pass — v1.4.2 (redesign branch)

This pass merged the fixes from the v1.4.1 merge into this newer, visually
redesigned branch (new shared components: Badge, Button, Card, EmptyState,
SectionHeader, StatCard — new "acacia/tan" color palette throughout). This
branch had already independently fixed two bugs from the previous pass
(the admin `requireAdmin` misuse and the finance panel's scope bug) and had
built a genuinely better M-Pesa security fix than mine — see below.

## Already fixed on this branch before I touched it
- `requireAdmin()` call-site bug and the admin panel's missing `setFinance`
  call — both already correct here.
- **The core CSRF bug was fixed at the root**, not per-call-site: this
  branch added the actual missing `enforceSameOrigin()` function to
  `lib/request-security.ts` with the exact `null | NextResponse` return
  shape every call site was already written to expect. That's a better fix
  than rewriting 18 call sites (what I did on the last two branches) — I
  adopted this approach going forward instead of reverting it.
- **A better M-Pesa payment fix than my own**: instead of just checking a
  shared secret, this branch has the callback independently query
  Safaricom's real transaction status (`queryMpesaTransactionStatus`)
  rather than trusting the callback body's claimed result at all. I kept
  this and layered my secret-check on top as defense-in-depth (rejects
  junk/spam POSTs before they trigger a wasted verification API call) —
  the two are complementary, not redundant.

## Carried over from v1.4.1
- Gym/Trainer role, `FREE_MODE` toggle (pricing page now checks
  `/api/config` and shows free messaging by default, with the real
  Stripe/M-Pesa checkout preserved and ready for when it's turned off),
  the `Request`→`NextRequest` fixes, implicit-`any` fixes, and the
  `Date|String` typo — all reapplied here since this branch forked before
  those existed.
- The `maxChatImages` naming fix (2 places) and the inconsistent
  subscription-status checks (account page, tutor page, dashboard nav) —
  same bugs, present here too since the redesign touched these files'
  visuals but not this underlying logic.

## Flagged, not silently fixed
Same as both previous passes: Vercel Blob has no private-file mode, so
school ID verification photos and community post images are technically
fetchable by anyone with the URL. Unchanged from before — still a real
design decision for you, not something changed unilaterally.

## Verification performed
- Fresh `npm install` — resolved cleanly.
- `npx tsc --noEmit` — zero errors.
- `npm run build` — compiles, lints, and type-checks clean. Fails only at
  the final "collect page data" step because this sandbox's network blocks
  Prisma's binary server (confirmed by checking for the missing `.node`
  engine file directly) — not a code issue.
- Full sweep across the whole codebase for every bug pattern found across
  all three merge passes so far — confirmed no other instances remain.
