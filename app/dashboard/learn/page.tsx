import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseView from "@/components/courses/CourseView";

export default async function CoursePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      lessons: true,
    },
  });

  if (!course) {
    return <div>Course not found</div>;
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { userId: session.user.id, courseId: course.id },
  });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, courseId: course.id },
  });

  // Convert Prisma Date objects to strings to satisfy the TypeScript definition in CourseView
  const serializedCourse = {
    ...course,
    scheduledAt: course.scheduledAt ? new Date(course.scheduledAt).toISOString() : null,
    createdAt: course.createdAt ? course.createdAt.toISOString() : null,
    updatedAt: course.updatedAt ? course.updatedAt.toISOString() : null,
  };

  return (
    <CourseView 
      course={serializedCourse} 
      enrolled={!!enrollment} 
      progress={progress} 
    />
  );
}