import { createClient } from "./supabase/server-client";

export type LibraryMaterial = { id: number; label: string; kind: string; href: string };

export async function getMaterialsLibrary(): Promise<LibraryMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, label, kind, href")
    .order("created_at", { ascending: false })
    .returns<LibraryMaterial[]>();

  if (error) throw error;
  return data;
}
