import { createClient } from "./supabase/server-client";
import type { LibraryMaterial } from "./materials";

export type AdminExam = {
  examId: number;
  category: string;
  date: string;
  when: string;
  topics: string[];
  materials: LibraryMaterial[];
};

export type AdminSubject = {
  id: string;
  code: string | null;
  name: string;
  profId: number | null;
  exams: AdminExam[];
};

type Row = {
  id: string;
  code: string | null;
  name: string;
  prof_id: number | null;
  exams: {
    id: number;
    category: string;
    exam_date: string;
    when_label: string;
    topics: { label: string; sort_order: number }[];
    exam_materials: {
      sort_order: number;
      materials: { id: number; label: string; kind: string; href: string };
    }[];
  }[];
};

export async function getAdminSubjects(): Promise<AdminSubject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, code, name, prof_id,
      exams (
        id, category, exam_date, when_label,
        topics ( label, sort_order ),
        exam_materials ( sort_order, materials ( id, label, kind, href ) )
      )
    `
    )
    .order("sort_order")
    .returns<Row[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    profId: row.prof_id,
    exams: row.exams.map((exam) => ({
      examId: exam.id,
      category: exam.category,
      date: exam.exam_date,
      when: exam.when_label,
      topics: [...exam.topics].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.label),
      materials: [...exam.exam_materials]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((em): LibraryMaterial => em.materials),
    })),
  }));
}
