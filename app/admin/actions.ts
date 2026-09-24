"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server-client";
import type { AdminMaterial } from "@/lib/admin-subjects";
import type { Period } from "@/lib/subjects";

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

export async function saveSubject(
  subjectId: string,
  payload: {
    code: string;
    name: string;
    prof: string;
    exams: Record<Period, { examId: number; date: string; when: string; topics: string[]; materials: AdminMaterial[] }>;
  }
) {
  const supabase = await requireUser();

  const { error: subjectError } = await supabase
    .from("subjects")
    .update({ code: payload.code, name: payload.name, prof: payload.prof })
    .eq("id", subjectId);
  if (subjectError) throw subjectError;

  for (const period of ["p1", "p2"] as Period[]) {
    const exam = payload.exams[period];

    const { error: examError } = await supabase
      .from("exams")
      .update({ exam_date: exam.date, when_label: exam.when })
      .eq("id", exam.examId);
    if (examError) throw examError;

    const { error: delTopicsError } = await supabase.from("topics").delete().eq("exam_id", exam.examId);
    if (delTopicsError) throw delTopicsError;

    const topicRows = exam.topics
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, i) => ({ exam_id: exam.examId, label, sort_order: i }));
    if (topicRows.length) {
      const { error } = await supabase.from("topics").insert(topicRows);
      if (error) throw error;
    }

    const { data: existingMaterials, error: existingMaterialsError } = await supabase
      .from("materials")
      .select("href")
      .eq("exam_id", exam.examId);
    if (existingMaterialsError) throw existingMaterialsError;

    const { error: delMaterialsError } = await supabase.from("materials").delete().eq("exam_id", exam.examId);
    if (delMaterialsError) throw delMaterialsError;

    const materialRows = exam.materials
      .filter((m) => m.label.trim())
      .map((m, i) => ({
        exam_id: exam.examId,
        label: m.label.trim(),
        kind: m.kind.trim() || "Link",
        href: m.href.trim() || "#",
        sort_order: i,
      }));
    if (materialRows.length) {
      const { error } = await supabase.from("materials").insert(materialRows);
      if (error) throw error;
    }

    const keptHrefs = new Set(materialRows.map((m) => m.href));
    const removedHrefs = (existingMaterials ?? [])
      .map((m) => m.href)
      .filter((href) => !keptHrefs.has(href));
    await deleteBlobsSafely(removedHrefs);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addSubject(input: { id: string; code: string; name: string; prof: string }) {
  const supabase = await requireUser();

  const { count } = await supabase.from("subjects").select("id", { count: "exact", head: true });

  const { error: subjectError } = await supabase.from("subjects").insert({
    id: input.id,
    code: input.code,
    name: input.name,
    prof: input.prof,
    sort_order: (count ?? 0) + 1,
  });
  if (subjectError) throw subjectError;

  const today = new Date().toISOString().slice(0, 10);
  const { error: examError } = await supabase.from("exams").insert([
    { subject_id: input.id, period: "p1", exam_date: today, when_label: "" },
    { subject_id: input.id, period: "p2", exam_date: today, when_label: "" },
  ]);
  if (examError) throw examError;

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSubject(subjectId: string) {
  const supabase = await requireUser();

  const { data: exams, error: examsError } = await supabase
    .from("exams")
    .select("id")
    .eq("subject_id", subjectId);
  if (examsError) throw examsError;

  const examIds = (exams ?? []).map((e) => e.id);
  if (examIds.length) {
    const { data: materials, error: materialsError } = await supabase
      .from("materials")
      .select("href")
      .in("exam_id", examIds);
    if (materialsError) throw materialsError;
    await deleteBlobsSafely((materials ?? []).map((m) => m.href));
  }

  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
