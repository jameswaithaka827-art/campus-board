import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const courses = await prisma.course.findMany({ where: { published: true }, orderBy: { updatedAt: "desc" }, take: 30, include: { instructor: { select: { name: true } }, _count: { select: { lessons: true, enrollments: true } } } });
  const enrolled = new Set((await prisma.courseEnrollment.findMany({ where: { userId: session.user.id }, select: { courseId: true } })).map((x: { courseId: string }) => x.courseId));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Learn" title="Courses & Tuition" />
      <p className="-mt-4 max-w-2xl text-sm text-[#8a8578]">
        Continue learning at your own pace with notes, lessons, recordings and scheduled live classes.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c: any) => (
          <Card key={c.id} className="feature-card flex flex-col">
            <div className="text-xs font-semibold text-brand-300">{c.subject}</div>
            <h2 className="mt-1 text-xl font-semibold">{c.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-[#8a8578]">{c.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-[#6b6759]">
              <span>{c._count.lessons} lessons</span>
              <span>{c.instructor.name || "Instructor"}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/dashboard/learn/${c.id}`} className="flex-1 rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-ink hover:bg-brand-500">
                {enrolled.has(c.id) ? "Open course" : "View course"}
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {!courses.length && (
        <EmptyState title="No public courses yet. Your lecturer can publish one from Teaching Studio." />
      )}
    </div>
  );
}
