import { requirePageRole } from "@/lib/auth-page";
import { Alert, PageHeader } from "@/components/ui";

export default async function PlanningPage() {
  await requirePageRole(["FOLLOW_UP_AGENT"]);
  return (
    <>
      <PageHeader title="Planning" />
      <Alert kind="info">Planning du jour — disponible au Sprint 3.</Alert>
    </>
  );
}
