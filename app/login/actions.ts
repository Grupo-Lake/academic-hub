"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";

export async function login(_prevState: string | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return "Email ou senha inválidos.";
  }

  redirect("/admin");
}
