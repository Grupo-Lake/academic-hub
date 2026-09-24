import { getSubjects } from "@/lib/subjects";
import StudyHub from "./study-hub";

export default async function Home() {
  const subjects = await getSubjects();
  return <StudyHub subjects={subjects} />;
}
