import { createClient } from "./supabase/server-client";

export type Professor = { id: number; name: string; email: string | null };

export async function getProfessors(): Promise<Professor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professors")
    .select("id, name, email")
    .order("sort_order")
    .returns<Professor[]>();

  if (error) throw error;
  return data;
}
