import { prisma } from "@/lib/prisma";

export const TEACHING_ROLES = new Set(["lecturer", "teacher", "admin"]);

export async function requireTeachingUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountStatus: true, name: true, email: true },
  });
  if (!user || user.accountStatus !== "active" || !user.role || !TEACHING_ROLES.has(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
