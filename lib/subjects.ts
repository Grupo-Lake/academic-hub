import { getSupabase } from "./supabase/client";

export type Period = "p1" | "p2";

export type Link = { label: string; kind: string; href: string };

export type Exam = {
  date: string;
  when: string;
  topics: string[];
  links: Link[];
};

export type Subject = {
  id: string;
  code: string;
  name: string;
  prof: string;
  exams: Record<Period, Exam>;
};

type SubjectRow = {
  id: string;
  code: string;
  name: string;
  prof: string;
  exams: {
    period: Period;
    exam_date: string;
    when_label: string;
    topics: { label: string; sort_order: number }[];
    materials: { label: string; kind: string; href: string; sort_order: number }[];
  }[];
};

export async function getSubjects(): Promise<Subject[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, code, name, prof,
      exams (
        period, exam_date, when_label,
        topics ( label, sort_order ),
        materials ( label, kind, href, sort_order )
      )
    `
    )
    .order("sort_order")
    .returns<SubjectRow[]>();

  if (error) throw error;

  return data.map((row) => {
    const exams = {} as Record<Period, Exam>;
    for (const exam of row.exams) {
      exams[exam.period] = {
        date: exam.exam_date,
        when: exam.when_label,
        topics: [...exam.topics].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.label),
        links: [...exam.materials]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m): Link => ({ label: m.label, kind: m.kind, href: m.href })),
      };
    }
    return { id: row.id, code: row.code, name: row.name, prof: row.prof, exams };
  });
}
