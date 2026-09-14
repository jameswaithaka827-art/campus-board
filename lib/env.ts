// Fails fast and loud when required env vars are missing, instead of letting
// the app boot into a broken state (e.g. Stripe calls silently failing with
// an empty API key, or NextAuth signing sessions with an empty secret).
//
// Import `requireEnv` from the module that actually needs a var, right
// before using it — that keeps this file honest about what's required for
// *this* deployment vs. optional (e.g. Stripe vars only matter once you
// wire up billing).

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env.local against .env.example.`
    );
  }
  return value;
}
