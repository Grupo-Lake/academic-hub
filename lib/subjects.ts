import { getSupabase } from "./supabase/client";

export type Link = { label: string; kind: string; href: string };

export type Exam = {
  date: string;
  when: string;
  topics: string[];
  links: Link[];
};

export type Subject = {
  id: string;
  code: string | null;
  name: string;
  prof: string | null;
  exams: Record<string, Exam>;
  categoryOrder: string[];
};

type SubjectRow = {
  id: string;
  code: string | null;
  name: string;
  professors: { name: string } | null;
  exams: {
    category: string;
    exam_date: string;
    when_label: string;
    topics: { label: string; sort_order: number }[];
    exam_materials: {
      sort_order: number;
      materials: { label: string; kind: string; href: string };
    }[];
  }[];
};

export async function getSubjects(): Promise<Subject[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, code, name,
      professors ( name ),
      exams (
        category, exam_date, when_label,
        topics ( label, sort_order ),
        exam_materials ( sort_order, materials ( label, kind, href ) )
      )
    `
    )
    .order("sort_order")
    .returns<SubjectRow[]>();

  if (error) throw error;

  return data.map((row) => {
    const exams: Record<string, Exam> = {};
    const categoryOrder: string[] = [];
    for (const exam of row.exams) {
      categoryOrder.push(exam.category);
      exams[exam.category] = {
        date: exam.exam_date,
        when: exam.when_label,
        topics: [...exam.topics].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.label),
        links: [...exam.exam_materials]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((em): Link => ({ label: em.materials.label, kind: em.materials.kind, href: em.materials.href })),
      };
    }
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      prof: row.professors?.name ?? null,
      exams,
      categoryOrder,
    };
  });
}

export function getCategoryOrder(subjects: Subject[]): string[] {
  const seen: string[] = [];
  for (const subject of subjects) {
    for (const category of subject.categoryOrder) {
      if (!seen.includes(category)) seen.push(category);
    }
  }
  return seen;
}
