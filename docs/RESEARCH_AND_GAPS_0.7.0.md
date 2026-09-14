# James AI v0.7.0 — Research, Product Direction & Gap Review

Date: 2026-09-05

## Product direction
James AI now extends the original student workspace (Chat, Planner, Notes, Time Tracking, Reminders, Account, Pricing) with a study-first community and student marketplace. The community is deliberately framed as academic networking rather than dating.

## New product layer
- Study profiles: course, year, study interests, sports/activities, short bio, matching opt-in.
- Compatibility matching: course/subject is weighted most heavily, then year, study interests, sports/activities and study mode.
- Live study rooms: member count, recent messages, online heartbeat and in-app chat. The first implementation uses database-backed short polling so it works on ordinary Next.js hosting; a later production scale-out can swap the transport to a realtime provider.
- Connections: students can send/accept/decline connections; blocking removes existing connections.
- Safety: no exact location or phone number is part of matching, users can block/report, and admins can review open reports.
- Marketplace: student listings are connected to the same account so students can discover academic goods/services without leaving James AI.

## Research-backed implementation choices
- Supabase Realtime documents Presence for online/offline state and Broadcast for low-latency messaging. This is a good future transport layer if the application moves to a realtime Postgres/Supabase backend. https://supabase.com/docs/guides/realtime/presence
- Zoom's Video SDK for Web supports screen sharing and browser rendering, so it remains a viable future live-class layer. https://developers.zoom.us/docs/video-sdk/web/share/
- YouTube's IFrame Player API supports embedded video playback and JavaScript controls, making it suitable for recorded lessons. https://developers.google.com/youtube/iframe_api_reference
- Firebase App Check documents reCAPTCHA Enterprise for web and Play Integrity/DeviceCheck for mobile, providing a future app-attestation layer for abuse prevention. https://firebase.google.com/docs/app-check
- Apple requires complete, functional builds and working in-app purchases for review; its review guidelines also cover account deletion and third-party login rules. https://developer.apple.com/app-store/review/guidelines/

## Biggest remaining engineering gaps
1. Full production verification: run install, Prisma migration, typecheck and production build on a clean machine/CI.
2. Move from SQLite to a hosted Postgres database before significant multi-user scale.
3. Replace short polling with a true realtime transport for high-volume chat/presence.
4. Add automated browser E2E tests for signup, verification, authorization, community, reporting, account deletion and Pro entitlements.
5. Add native store billing adapters for Android/iOS instead of using web checkout in store-distributed builds.
6. Add a formal content-moderation pipeline and admin review queue for community/marketplace text and images.
7. Add rate limiting backed by a distributed store for serverless deployments.
8. Add backups, incident response, secrets rotation and monitoring.

## 10/10 target
The app should only be called production-ready after those gates pass in CI and on real devices. A score of 10/10 is a target, not a promise that can be proven by static code inspection alone.
