function normalizedDomains(): string[] {
  const raw = process.env.GOOGLE_ALLOWED_DOMAINS || "gmail.com";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

export function isAllowedGoogleAccount(input: {
  email: unknown;
  emailVerified: unknown;
  hostedDomain?: unknown;
}) {
  if (typeof input.email !== "string" || input.email.length > 320) return false;
  if (input.emailVerified !== true) return false;

  const email = input.email.toLowerCase().trim();
  const domain = getEmailDomain(email);
  const allowed = normalizedDomains();
  if (!allowed.includes(domain)) return false;

  // For Workspace domains, require Google's `hd` claim to match the domain.
  // Consumer Gmail accounts are authoritative by the @gmail.com address.
  if (domain !== "gmail.com") {
    if (typeof input.hostedDomain !== "string") return false;
    return input.hostedDomain.toLowerCase().trim() === domain;
  }

  return true;
}

export function isAllowedLecturerDomain(email: string): boolean {
  const raw = process.env.LECTURER_ALLOWED_DOMAINS || "";
  const domains = raw
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return domains.includes(getEmailDomain(email));
}
