import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { getAdminSubjects } from "@/lib/admin-subjects";
import { getProfessors } from "@/lib/professors";
import { getMaterialsLibrary } from "@/lib/materials";
import AdminEditor from "./admin-editor";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const [subjects, professors, materials] = await Promise.all([
    getAdminSubjects(),
    getProfessors(),
    getMaterialsLibrary(),
  ]);

  return <AdminEditor initialSubjects={subjects} professors={professors} materials={materials} />;
}
