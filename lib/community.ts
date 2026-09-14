import { prisma } from "@/lib/prisma";

const asArray = (value: string | null | undefined) => {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []; }
  catch { return []; }
};

export function parseStudentProfile(profile: any) {
  if (!profile) return null;
  return { ...profile, studyInterests: asArray(profile.studyInterests), sports: asArray(profile.sports) };
}

export function matchScore(a: any, b: any) {
  let score = 0;
  if (a.courseOfStudy && b.courseOfStudy && a.courseOfStudy.toLowerCase() === b.courseOfStudy.toLowerCase()) score += 45;
  if (a.yearOfStudy && b.yearOfStudy && a.yearOfStudy === b.yearOfStudy) score += 15;
  const ai = new Set(asArray(a.studyInterests).map((x) => x.toLowerCase()));
  const bi = new Set(asArray(b.studyInterests).map((x) => x.toLowerCase()));
  const commonInterests = [...ai].filter((x) => bi.has(x)).length;
  score += Math.min(20, commonInterests * 5);
  const as = new Set(asArray(a.sports).map((x) => x.toLowerCase()));
  const bs = new Set(asArray(b.sports).map((x) => x.toLowerCase()));
  const commonSports = [...as].filter((x) => bs.has(x)).length;
  score += Math.min(10, commonSports * 5);
  if (a.studyMode && b.studyMode && (a.studyMode === b.studyMode || a.studyMode === "both" || b.studyMode === "both")) score += 10;
  return Math.min(100, score);
}

export function safeCommunityName(name: string | null | undefined) {
  return (name || "Student").slice(0, 80);
}
