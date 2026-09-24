import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { getAdminSubjects } from "@/lib/admin-subjects";
import AdminEditor from "./admin-editor";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const subjects = await getAdminSubjects();

  return <AdminEditor initialSubjects={subjects} />;
}
