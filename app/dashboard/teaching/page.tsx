import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachingStudio from "./teaching-studio";
import { TEACHING_ROLES } from "@/lib/role-access";

export default async function TeachingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!session.user.role || !TEACHING_ROLES.has(session.user.role)) redirect("/dashboard");
  const courses = await prisma.course.findMany({ where: { instructorId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { lessons: true, enrollments: true, liveClasses: true } } } });
  return <TeachingStudio initialCourses={courses} role={session.user.role} />;
}
