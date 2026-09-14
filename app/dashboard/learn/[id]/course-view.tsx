"use client";

import { useState } from "react";
import Link from "next/link";

type Lesson = { id: string; title: string; summary: string | null; videoUrl: string | null };
type LiveClass = { id: string; title: string; scheduledAt: string; joinUrl: string };
type Course = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  instructor: { name: string | null };
  lessons: Lesson[];
  liveClasses: LiveClass[];
};

export default function CourseView({
  course,
  enrolled: initialEnrolled,
  completed,
}: {
  course: Course;
  enrolled: boolean;
  completed: string[];
}) {
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [completedIds, setCompletedIds] = useState<string[]>(completed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enroll() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/learn/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: course.id }),
    });
    setBusy(false);
    if (res.ok) setEnrolled(true);
    else setError((await res.json().catch(() => null))?.error || "Could not enroll.");
  }

  async function toggleLesson(lessonId: string, done: boolean) {
    setCompletedIds((prev) => (done ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)));
    await fetch("/api/learn/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed: done }),
    });
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <p className="text-xs font-semibold text-brand-300">{course.subject}</p>
        <h1 className="text-2xl font-semibold mt-1">{course.title}</h1>
        <p className="text-sm text-white/60 mt-2">{course.description}</p>
        <p className="text-xs text-white/40 mt-2">Taught by {course.instructor.name || "Instructor"}</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!enrolled ? (
        <button
          onClick={enroll}
          disabled={busy}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {busy ? "Enrolling..." : "Enroll in this course"}
        </button>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">Lessons</h2>
            <div className="space-y-2">
              {course.lessons.map((lesson) => {
                const done = completedIds.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className="border border-white/10 rounded-xl bg-white/[0.03] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                      {lesson.summary && <div className="text-sm text-white/50 mt-1">{lesson.summary}</div>}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-white/60 shrink-0">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(e) => toggleLesson(lesson.id, e.target.checked)}
                      />
                      Done
                    </label>
                  </div>
                );
              })}
              {!course.lessons.length && (
                <p className="text-sm text-white/40">No lessons published yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Live classes</h2>
            <div className="space-y-2">
              {course.liveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="border border-white/10 rounded-xl bg-white/[0.03] p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium">{lc.title}</div>
                    <div className="text-xs text-white/50 mt-1">{new Date(lc.scheduledAt).toLocaleString()}</div>
                  </div>
                  
                    href={lc.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5 shrink-0"
                  >
                    Join
                  </a>
                </div>
              ))}
              {!course.liveClasses.length && (
                <p className="text-sm text-white/40">No live classes scheduled.</p>
              )}
            </div>
          </section>
        </>
      )}

      <Link href="/dashboard/learn" className="inline-block text-xs text-white/50 hover:text-white">
        ← Back to courses
      </Link>
    </div>
  );
}