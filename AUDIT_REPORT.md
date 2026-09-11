# James AI v0.2.0 — Code Audit & Revision

Date: 2026-09-05

## Goal

Keep the existing James AI structure and improve reliability for a community release: public signup, AI chat, planner, notes, time tracking, reminders, and optional monthly billing.

## Findings fixed in this revision

1. **Monthly free usage was not monthly.** The previous `chatMessageCount` had no period marker, so the UI said “this month” while the counter could remain exhausted forever. The revision adds `chatUsageMonth` and resets the counter automatically when a new UTC month begins.

2. **AI usage could be bypassed between features.** Chat, Planner generation, and Notes generation each enforced the same concept separately. The revision centralizes the budget in `lib/ai-usage.ts`, making the free allowance a single 20-action monthly budget across those AI features. A reserved action is refunded when the AI provider fails.

3. **Chat history returned the oldest messages.** The previous GET route sorted ascending while using `take: 100`. The revision loads the latest 100 and reverses them for display.

4. **Planner AI output relied on loose JSON prompting.** OpenAI's Responses API supports Structured Outputs. The revision uses a JSON Schema wrapper for the planner when OpenAI is selected, while retaining defensive server-side validation with `parseBlockInput`.

5. **AI code was duplicated across routes.** `lib/ai-client.ts` now centralizes provider selection. `AI_PROVIDER=openai` uses the OpenAI Responses API and defaults to `gpt-5.6-luna`; `AI_PROVIDER=anthropic` keeps the existing Anthropic path available.

6. **Planner reminders used one deployment-wide timezone.** The revision adds a per-user timezone (default `Africa/Nairobi`) and updates the cron logic to evaluate each schedule in that user's local clock.

7. **Planner draft saving ignored partial failures.** The revision checks every generated block request and keeps successful saves visible instead of always reporting success.

8. **Student support was missing from the role presets.** A Student role was added without changing the existing Notes/Planner page structure.

9. **Landing and pricing language did not match the community goal.** Copy now emphasizes a free, everyday AI assistant for chat, learning, planning, notes, time management, and reminders. Paid pricing remains optional.

10. **NextAuth dependency was stale.** `next-auth` was raised to the current 4.x patch line used for this revision.

## Production blockers / next required hardening

- **Database:** SQLite is fine for local development/classroom demonstrations, but a multi-instance public deployment should use managed PostgreSQL.
- **Rate limiting:** the existing in-memory limiter is not shared between serverless instances; replace it with a shared store before relying on it for community-wide abuse protection.
- **Framework security lifecycle:** the project starts on Next.js 14.2.35. Next.js currently lists 14.x as unsupported and recommends serving production traffic on the latest Active or Maintenance LTS release. The August 2026 security release lists 15.5.24 and 16.3.3 as fixed lines for two critical vulnerabilities. A Next.js major-version migration should be performed and tested before a real public launch.
- **Email security:** email verification and password reset are still absent.
- **Community moderation:** a public launch should add reporting, abuse controls, account suspension tools, and clear community rules.
- **Billing:** set the Stripe Price ID to the amount you actually want to charge. The UI uses $5/month as a simple school-project example; it is not a recommendation for your final local price.
- **Healthcare role:** do not use the Doctor role for real patient data without proper compliance and security controls.

## Feature roadmap that preserves the structure

### Keep now

Chat, Planner, Notes, Time Tracking, Reminders, Account, Pricing.

### Add next

- Multiple conversations instead of one endless chat history.
- Exam records: exam date, subject, topics, priority, and progress.
- Study-plan generation from exam dates and available hours.
- Task checklist and daily priorities on the dashboard.
- Reminder types: study session, assignment due date, exam countdown.
- “Today” dashboard summary combining planner, tasks, reminders, and study progress.
- Import/paste notes into Study Notes and generate summaries and self-test questions.
- Basic analytics: study time this week, completed tasks, upcoming exams.

### Add after 100-user testing

- Postgres migration.
- Shared rate limiting.
- Background job/queue for reminder delivery.
- Email verification and password reset.
- Privacy controls and account deletion/export.
- Error monitoring and request tracing.
- Usage dashboard for the owner.
- Feature flags so experimental features can be enabled safely.

## Verification performed in this environment

- Project archive was extracted and source inventory reviewed.
- TypeScript/TSX/JS parser check passed for all project source files.
- Reminder-window/day arithmetic tests passed, including the midnight boundary.
- A full dependency installation and production Next.js build could not be completed in the sandbox because package installation timed out. Therefore this revision is **not** represented as having a verified `npm run build` result.

## External research used

- OpenAI Responses API documentation: Responses support text/JSON output, web search, file search, and function tools; the SDK/API exposes `output_text` and Structured Outputs. The planner revision follows the documented `json_schema` approach.
- OpenAI GPT-5.6 Luna model documentation: Luna is positioned as a cost-sensitive, high-volume model and currently lists $0.20/M input and $1.20/M output tokens.
- Next.js support/security documentation: Next.js 14 is unsupported; current supported production lines are 15.x Maintenance LTS and 16.x Active LTS, and the August 2026 security release lists 15.5.24 and 16.3.3 as fixed lines.
- MDN Web Push guidance: notifications should be permission-based, useful, time-sensitive, and easy to disable.
- YouTube reference reviewed for deployment workflow: Codevolution's Next.js 15 Vercel deployment tutorial demonstrates the GitHub/Vercel/environment-variable deployment path. This is treated as a tutorial reference, not a substitute for official platform documentation.
