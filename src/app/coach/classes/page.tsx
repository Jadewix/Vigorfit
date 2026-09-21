import { requireRole } from "@/backend/auth";
import { ClassesPanel } from "@/app/_classes/classes-panel";

export default async function CoachClassesPage() {
  const viewer = await requireRole(["coach"]);
  return <ClassesPanel viewer={viewer} />;
}
