# James AI 1.4 — Security Model

1. Never expose provider secrets in React/client code.
2. Use provider callbacks/webhooks for authoritative payment state.
3. Require server-side role checks for lecturer/admin operations.
4. Increment sessionVersion when privileged access changes require immediate revocation.
5. Store only the minimum school-ID data needed for verification and delete the document after review.
6. Keep community reporting, blocking and rate limits enabled from day one.
7. Add distributed rate limiting and managed secrets before public scale; the current in-memory limiter is a local/development baseline.
8. Complete external security assessment and data-protection review before real student launch.
