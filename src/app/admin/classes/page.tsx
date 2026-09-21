import { requireRole } from "@/backend/auth";
import { ClassesPanel } from "@/app/_classes/classes-panel";

export default async function AdminClassesPage() {
  const viewer = await requireRole(["admin"]);
  return <ClassesPanel viewer={viewer} />;
}
