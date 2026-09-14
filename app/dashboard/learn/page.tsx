import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      instructor: { select: { name: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  const enrolledIds = new Set(
    (
      await prisma.courseEnrollment.findMany({
        where: { userId: session.user.id },
        select: { courseId: true },
      })
    ).map((x) => x.courseId)
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold text-brand-300">Learn</p>
        <h1 className="text-2xl font-semibold mt-1">Courses & Tuition</h1>
        <p className="text-sm text-white/60 mt-1 max-w-2xl">
          Continue learning at your own pace with notes, lessons, recordings and scheduled live classes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="border border-white/10 rounded-xl bg-white/[0.03] p-5 flex flex-col">
            <div className="text-xs font-semibold text-brand-300">{c.subject}</div>
            <h2 className="mt-1 text-lg font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-white/60 line-clamp-3">{c.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/50">
              <span>{c._count.lessons} lessons</span>
              <span>{c.instructor.name || "Instructor"}</span>
            </div>
            <Link
              href={`/dashboard/learn/${c.id}`}
              className="mt-4 rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-500"
            >
              {enrolledIds.has(c.id) ? "Open course" : "View course"}
            </Link>
          </div>
        ))}
      </div>

      {!courses.length && (
        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-sm text-white/50">
          No public courses yet. Your lecturer can publish one from Teaching Studio.
        </div>
      )}
    </div>
  );
}