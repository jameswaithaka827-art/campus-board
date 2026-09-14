import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseManager from "./course-manager";

export default async function TeachingCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session=await getServerSession(authOptions); if(!session?.user?.id)redirect('/login');
  const course=await prisma.course.findUnique({where:{id,instructorId:session.user.id},include:{lessons:{orderBy:{position:'asc'}},liveClasses:{orderBy:{scheduledAt:'asc'}}}}); if(!course)notFound();
  return <CourseManager course={course} />;
}
