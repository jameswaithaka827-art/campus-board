export type UserRole = "student" | "doctor" | "teacher" | "lecturer" | "business" | "gym" | null;

export const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    noteLabel: string;
    placeholder: string;
    systemHint: string;
    plannerLabel: string;
    plannerPlaceholder: string;
  }
> = {
  student: {
    label: "Student",
    noteLabel: "Study Notes",
    placeholder: "e.g. Computer Networks: OSI model, TCP/IP, subnetting, routing — exam next week...",
    systemHint:
      "You are helping a student turn rough study notes into a clear revision document. " +
      "Organize key concepts, definitions, examples, and questions for self-testing. " +
      "Do not invent facts that are not supported by the notes.",
    plannerLabel: "Study Timetable",
    plannerPlaceholder:
      "e.g. Networking exam Friday, database exam next Tuesday, lectures Mon/Wed 9-11am, revise evenings...",
  },
  doctor: {
    label: "Doctor",
    noteLabel: "Patient Notes",
    placeholder: "e.g. Patient presented with mild fever, 38.2C, complains of sore throat since Monday...",
    systemHint:
      "You are helping a doctor turn rough clinical notes into a clean, well-structured patient note. " +
      "Keep it factual, use standard clinical sections where relevant (Subjective, Objective, Assessment, Plan), " +
      "and do not invent details the doctor didn't provide.",
    plannerLabel: "Shift Schedule",
    plannerPlaceholder:
      "e.g. 12-hour shifts Mon/Wed/Fri starting 7am, ward rounds first hour, staff meeting Wednesdays at 8am...",
  },
  lecturer: {
    label: "Lecturer",
    noteLabel: "Teaching Notes",
    placeholder: "e.g. Database Systems, normalization, tutorial questions, assignment feedback...",
    systemHint:
      "You are helping a university lecturer organize course notes, teaching plans, assessment ideas, and student-facing material without inventing details.",
    plannerLabel: "Lecture Timetable",
    plannerPlaceholder:
      "e.g. Database Systems Monday 10-12, office hours Tuesday 2-4, marking Thursday afternoon...",
  },
  teacher: {
    label: "Teacher",
    noteLabel: "Lesson Plans",
    placeholder: "e.g. Grade 7 science, topic: photosynthesis, 45 min class, need an intro activity...",
    systemHint:
      "You are helping a teacher turn a rough idea into a clear, organized lesson plan " +
      "(objective, materials, activity steps, timing, and an assessment/check-for-understanding).",
    plannerLabel: "Class Timetable",
    plannerPlaceholder:
      "e.g. Grade 7 science Mon/Wed/Fri 9-10am, staff meeting Tuesdays 3pm, marking time blocked Thursday afternoons...",
  },
  business: {
    label: "Business",
    noteLabel: "Meeting Notes",
    placeholder: "e.g. Discussed Q3 roadmap, marketing wants more budget, need decision by Friday...",
    systemHint:
      "You are helping turn rough meeting notes into a clean summary with clear sections: " +
      "Key Discussion Points, Decisions Made, and Action Items (with owners if mentioned).",
    plannerLabel: "Work Schedule",
    plannerPlaceholder:
      "e.g. Standup 9am daily, deep work mornings, client calls Tue/Thu afternoons, gym after work Mon/Wed/Fri...",
  },
  gym: {
    label: "Gym / Trainer",
    noteLabel: "Client Session Notes",
    placeholder: "e.g. Client did 3x8 back squat at 80kg, mentioned mild knee soreness, good energy today...",
    systemHint:
      "You are helping a personal trainer turn rough session notes into a clean client progress note: " +
      "exercises/sets/weights performed, how the client felt, and any flags to watch (pain, fatigue, form) " +
      "plus a short note on progress since last session if mentioned.",
    plannerLabel: "Session Schedule",
    plannerPlaceholder:
      "e.g. Client A Mon/Wed/Fri 6am, Client B Tue/Thu 5pm, own training block Saturday mornings...",
  },
};

export function getRoleConfig(role: string | null | undefined) {
  if (role && ROLE_CONFIG[role]) return ROLE_CONFIG[role];
  return {
    label: "General",
    noteLabel: "Notes",
    placeholder: "Type your rough notes here...",
    systemHint: "You are helping turn rough notes into a clean, well-organized write-up.",
    plannerLabel: "My Week",
    plannerPlaceholder:
      "e.g. Gym Mon/Wed/Fri 6am, classes Tue/Thu 9-11am, part-time job weekends 10am-4pm...",
  };
}
