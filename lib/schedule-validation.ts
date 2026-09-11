const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // 24h "HH:MM"

export type ValidBlockInput = {
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  category: string | null;
  notify: boolean;
};

/**
 * Validates one candidate schedule block, whether it came from a manual
 * form submission or from parsing the AI's draft response. Returns a
 * sanitized value or an error string — never throws, so callers can just
 * skip/report invalid entries instead of crashing on one bad item.
 */
export function parseBlockInput(input: unknown): { ok: true; value: ValidBlockInput } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "block must be an object" };
  }
  const { day, startTime, endTime, title, category, notify } = input as Record<string, unknown>;

  if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) {
    return { ok: false, error: "day must be 0 (Monday) through 6 (Sunday)" };
  }
  if (typeof startTime !== "string" || !TIME_RE.test(startTime)) {
    return { ok: false, error: "startTime must be in HH:MM 24h format" };
  }
  if (typeof endTime !== "string" || !TIME_RE.test(endTime)) {
    return { ok: false, error: "endTime must be in HH:MM 24h format" };
  }
  if (endTime <= startTime) {
    return { ok: false, error: "endTime must be after startTime" };
  }
  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, error: "title is required" };
  }
  if (title.length > 200) {
    return { ok: false, error: "title must be under 200 characters" };
  }

  return {
    ok: true,
    value: {
      day,
      startTime,
      endTime,
      title: title.trim(),
      category: typeof category === "string" && category.trim() ? category.trim().slice(0, 50) : null,
      notify: Boolean(notify),
    },
  };
}
