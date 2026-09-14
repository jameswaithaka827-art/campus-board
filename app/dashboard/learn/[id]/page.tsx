import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseView from "./course-view";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { name: true } },
      lessons: { where: { published: true }, orderBy: { position: "asc" } },
      liveClasses: { orderBy: { scheduledAt: "asc" } },
    },
  });
  if (!course || !course.published) notFound();

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: session.user.id } },
  });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lesson: { courseId: course.id } },
    select: { lessonId: true, completed: true },
  });

  const serializedCourse = {
    ...course,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    liveClasses: course.liveClasses.map((lc) => ({
      ...lc,
      scheduledAt: lc.scheduledAt.toISOString(),
    })),
  };

  const completedLessonIds = progress.filter((p) => p.completed).map((p) => p.lessonId);

  return (
    <CourseView
      course={serializedCourse}
      enrolled={!!enrollment}
      completed={completedLessonIds}
    />
  );
}