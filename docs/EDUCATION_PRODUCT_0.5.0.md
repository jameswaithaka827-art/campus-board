# James AI v0.5.0 — Education Product Direction

## Student
- AI chat with web research
- Notes
- Planner and reminders
- Courses and lessons
- Self-paced tuition
- Live class schedule and join links
- Lesson completion tracking
- Future: assignments, quizzes, analytics, certificates

## Teacher / Lecturer
- Teaching Studio
- Course creation
- Lesson notes and materials
- Live class scheduling
- Recording links
- Student list and course enrollment
- Future: assignments, grading, attendance, announcements, office hours

## Admin
- User management
- Account verification and suspension
- Role management
- Audit log
- Future: course approvals, platform announcements, subscription analytics, moderation, support dashboard

## Live class providers
The data model intentionally stores the provider (`zoom`, `youtube`, `whatsapp`, `external`) and a join URL. This allows the UI to support more than one provider without changing the student experience.

YouTube can be embedded directly through its IFrame Player API and its Live Streaming API can create/manage broadcasts with appropriate channel authorization. Zoom provides a React-compatible Video SDK for custom in-app video experiences. WhatsApp can be linked with `wa.me` click-to-chat or used for group/community handoff.
