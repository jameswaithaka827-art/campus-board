# James AI v0.5.0 — App Store / Mobile Readiness

## Current state
James AI is a responsive Next.js web application with a PWA manifest. It is **not yet a store-submittable Android/iOS app**. The PWA is the web foundation; a production mobile package still needs Android/iOS native projects, signing, store metadata, privacy declarations, and store-specific purchase integration.

## Google Play gates to plan for
- Play Console developer identity and contact verification.
- Closed testing for new personal developer accounts: at least 12 testers opted in continuously for 14 days before production access.
- Accurate Data Safety form and privacy policy.
- In-app and external account-deletion path.
- Play Billing for digital Pro subscriptions/features in a Play-distributed app.
- Android device verification for applicable new personal developer accounts.

## Apple App Store gates to plan for
- Apple Developer Program membership.
- App Store Connect metadata and a review-ready build.
- Privacy policy inside the app and in App Store Connect.
- In-app account deletion.
- If Google/social login remains a primary account login, implement the Apple-required equivalent sign-in option unless the education-account exception clearly applies to the final distribution model.
- Digital subscriptions/features use Apple's In-App Purchase system in the iOS app.
- Provide App Review with a working demo account or demo mode and clear notes for account-based features and purchases.

## Recommended mobile path
1. Keep the responsive web/PWA as the single product foundation.
2. Add native Android/iOS shells only after the web app passes end-to-end tests.
3. Use native store billing for mobile Pro and keep Stripe for the website.
4. Use a shared server-side entitlement service so `free` / `pro` is determined by verified purchase status, not by the client UI.
5. Add deep links/universal links so login and course links reopen the installed app.

## Store-readiness checklist
- [ ] Android build (.aab) generated and signed
- [ ] iOS archive uploaded to App Store Connect
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Account deletion in-app + external web path
- [ ] Data Safety / App Privacy answers prepared
- [ ] Store screenshots and descriptions
- [ ] Google Play closed test completed where required
- [ ] Apple review notes + demo access prepared
- [ ] Native purchase products/subscriptions configured
- [ ] Subscription restore/cancel flow tested
- [ ] Push notification disclosures and permissions reviewed
- [ ] Production monitoring and crash reporting enabled

## Video/teaching integration choices
- YouTube: easiest first integration; James AI can embed a YouTube video or live player in a lesson page.
- WhatsApp: best used as an external community/contact link rather than the classroom video engine.
- Zoom: use the Zoom Video SDK for a genuinely in-app custom classroom, or open Zoom meetings as an external join flow for the first release.
