import { createClient } from "./supabase/server-client";
import type { Period } from "./subjects";

export type AdminMaterial = { label: string; kind: string; href: string };

export type AdminExam = {
  examId: number;
  date: string;
  when: string;
  topics: string[];
  materials: AdminMaterial[];
};

export type AdminSubject = {
  id: string;
  code: string;
  name: string;
  prof: string;
  exams: Record<Period, AdminExam>;
};

type Row = {
  id: string;
  code: string;
  name: string;
  prof: string;
  exams: {
    id: number;
    period: Period;
    exam_date: string;
    when_label: string;
    topics: { label: string; sort_order: number }[];
    materials: { label: string; kind: string; href: string; sort_order: number }[];
  }[];
};

export async function getAdminSubjects(): Promise<AdminSubject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, code, name, prof,
      exams (
        id, period, exam_date, when_label,
        topics ( label, sort_order ),
        materials ( label, kind, href, sort_order )
      )
    `
    )
    .order("sort_order")
    .returns<Row[]>();

  if (error) throw error;

  return data.map((row) => {
    const exams = {} as Record<Period, AdminExam>;
    for (const exam of row.exams) {
      exams[exam.period] = {
        examId: exam.id,
        date: exam.exam_date,
        when: exam.when_label,
        topics: [...exam.topics].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.label),
        materials: [...exam.materials]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => ({ label: m.label, kind: m.kind, href: m.href })),
      };
    }
    return { id: row.id, code: row.code, name: row.name, prof: row.prof, exams };
  });
}
