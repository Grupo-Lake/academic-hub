import { getSubjects } from "@/lib/subjects";
import StudyHub from "./study-hub";

export default async function Home() {
  const subjects = await getSubjects();
  return (
    <>
      <StudyHub subjects={subjects} />
      <script src="https://quge5.com/88/tag.min.js" data-zone="286157" async data-cfasync="false" />
    </>
  );
}
