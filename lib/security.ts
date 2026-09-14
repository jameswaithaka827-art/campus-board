import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser(): Promise<{ session: Session; userId: string }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return { session, userId };
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
