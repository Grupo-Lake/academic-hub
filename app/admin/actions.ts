"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server-client";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return supabase;
}

function isVercelBlobUrl(href: string): boolean {
  try {
    return new URL(href).hostname.endsWith(".vercel-storage.com");
  } catch {
    return false;
  }
}

async function deleteBlobsSafely(hrefs: string[]) {
  const urls = hrefs.filter(isVercelBlobUrl);
  if (!urls.length) return;
  try {
    await del(urls);
  } catch {
    // Best-effort cleanup — a failed delete here shouldn't block the DB write.
  }
}

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "disciplina";
}

// ---------- Disciplinas ----------

export async function saveSubject(
  subjectId: string,
  payload: {
    code: string | null;
    name: string;
    profId: number | null;
    exams: {
      examId: number | null;
      category: string;
      date: string;
      when: string;
      topics: string[];
      materialIds: number[];
    }[];
  }
) {
  const supabase = await requireUser();

  const { error: subjectError } = await supabase
    .from("subjects")
    .update({ code: payload.code, name: payload.name, prof_id: payload.profId })
    .eq("id", subjectId);
  if (subjectError) throw subjectError;

  const { data: existingExams, error: existingExamsError } = await supabase
    .from("exams")
    .select("id")
    .eq("subject_id", subjectId);
  if (existingExamsError) throw existingExamsError;

  const keptExamIds = new Set(payload.exams.map((e) => e.examId).filter((id): id is number => id !== null));
  const removedExamIds = (existingExams ?? []).map((e) => e.id).filter((id) => !keptExamIds.has(id));
  if (removedExamIds.length) {
    const { error } = await supabase.from("exams").delete().in("id", removedExamIds);
    if (error) throw error;
  }

  for (const exam of payload.exams) {
    let examId = exam.examId;

    if (examId === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("exams")
        .insert({ subject_id: subjectId, category: exam.category, exam_date: exam.date, when_label: exam.when })
        .select("id")
        .single();
      if (insertError) throw insertError;
      examId = inserted.id;
    } else {
      const { error: examError } = await supabase
        .from("exams")
        .update({ category: exam.category, exam_date: exam.date, when_label: exam.when })
        .eq("id", examId);
      if (examError) throw examError;
    }

    const { error: delTopicsError } = await supabase.from("topics").delete().eq("exam_id", examId);
    if (delTopicsError) throw delTopicsError;

    const topicRows = exam.topics
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, i) => ({ exam_id: examId, label, sort_order: i }));
    if (topicRows.length) {
      const { error } = await supabase.from("topics").insert(topicRows);
      if (error) throw error;
    }

    const { error: delMaterialsError } = await supabase.from("exam_materials").delete().eq("exam_id", examId);
    if (delMaterialsError) throw delMaterialsError;

    const materialRows = exam.materialIds.map((materialId, i) => ({
      exam_id: examId,
      material_id: materialId,
      sort_order: i,
    }));
    if (materialRows.length) {
      const { error } = await supabase.from("exam_materials").insert(materialRows);
      if (error) throw error;
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addSubject(input: { name: string; code?: string; profId?: number | null }) {
  const supabase = await requireUser();

  const base = slugify(input.name);
  const { data: existingIds, error: existingIdsError } = await supabase
    .from("subjects")
    .select("id")
    .or(`id.eq.${base},id.like.${base}-%`);
  if (existingIdsError) throw existingIdsError;

  const taken = new Set((existingIds ?? []).map((r) => r.id));
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n++;
  }

  const { count } = await supabase.from("subjects").select("id", { count: "exact", head: true });

  const { error: subjectError } = await supabase.from("subjects").insert({
    id,
    code: input.code?.trim() || null,
    name: input.name,
    prof_id: input.profId ?? null,
    sort_order: (count ?? 0) + 1,
  });
  if (subjectError) throw subjectError;

  revalidatePath("/");
  revalidatePath("/admin");
  return { id };
}

export async function deleteSubject(subjectId: string) {
  const supabase = await requireUser();

  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/admin");
}

// ---------- Professores ----------

export async function addProfessor(input: { name: string; email?: string }) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("professors")
    .insert({ name: input.name.trim(), email: input.email?.trim() || null });
  if (error) throw error;
  revalidatePath("/admin");
}

export async function updateProfessor(id: number, input: { name: string; email?: string | null }) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("professors")
    .update({ name: input.name.trim(), email: input.email?.trim() || null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProfessor(id: number) {
  const supabase = await requireUser();
  const { error } = await supabase.from("professors").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---------- Biblioteca de materiais ----------

export async function addLibraryMaterial(input: { label: string; kind: string; href: string }) {
  const supabase = await requireUser();
  const { data, error } = await supabase
    .from("materials")
    .insert({ label: input.label.trim(), kind: input.kind.trim() || "Arquivo", href: input.href.trim() })
    .select("id, label, kind, href")
    .single();
  if (error) throw error;
  revalidatePath("/admin");
  return data;
}

export async function updateLibraryMaterial(id: number, input: { label: string; kind: string; href: string }) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("materials")
    .update({ label: input.label.trim(), kind: input.kind.trim() || "Arquivo", href: input.href.trim() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLibraryMaterial(id: number) {
  const supabase = await requireUser();

  const { count, error: countError } = await supabase
    .from("exam_materials")
    .select("material_id", { count: "exact", head: true })
    .eq("material_id", id);
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(`Este material está anexado a ${count} prova(s); remova-o das provas antes de excluir.`);
  }

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("href")
    .eq("id", id)
    .single();
  if (materialError) throw materialError;

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;

  await deleteBlobsSafely([material.href]);
  revalidatePath("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
