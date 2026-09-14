# James AI v0.3.0 — Student Workspace Revision

## Product direction
This revision preserves the existing application structure: Chat, Planner, Notes, Time Tracking, Reminders, Account, and Pricing. It does not add JARVIS-style desktop automation or voice control.

## Added
- User profile photo upload on Account.
- Avatar shown in the main dashboard navigation.
- Vercel Blob storage integration for avatars.
- 3 MB upload limit and JPG/PNG/WebP type validation.
- Live web-search mode inside Chat using the OpenAI Responses API web search tool.
- Google shortcut: searches the current Chat input in a new tab.
- Student-workspace dashboard messaging and quick actions.
- Updated application metadata to describe the student/community use case.

## Existing fixes retained from v0.2.0
- Monthly free-AI usage reset and atomic reservation.
- Usage refund when an AI call fails.
- Latest chat history loaded first.
- Per-user reminder timezone.
- Structured Planner output on OpenAI.
- Better handling of partial Planner saves.

## Production notes
- Set `BLOB_READ_WRITE_TOKEN` locally, or connect Vercel Blob in the deployed Vercel project. Vercel documents Blob as a storage option for image uploads, and private Blob is available for sensitive files.
- Run `npx prisma db push` after pulling the revision so `User.avatarUrl` is added.
- The web-search button is powered by OpenAI when `AI_PROVIDER=openai`; the Anthropic path remains supported but does not claim to have browsed live web sources.
- A Google shortcut opens Google Search; it is not a Google API integration and does not require a Google API key.

## Verification
- Source inventory reviewed after modification.
- Static syntax-oriented inspection performed on changed TS/TSX files.
- Full `npm install` and `next build` were not run in this environment because dependencies are not installed in the sandbox and package installation may require network access.

## Recommended next revision
Keep the same structure and add: multiple conversations, exam records/countdown, daily dashboard summary, study progress analytics, image/file attachments in Chat, and automated end-to-end tests before inviting a larger group of users.


## Security upgrade included in 0.4.0
- Google OAuth sign-in, verified-email linking, stronger login throttling, optional password hash for Google-only accounts, and baseline security headers.
