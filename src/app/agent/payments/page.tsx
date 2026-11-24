import { requirePageRole } from "@/lib/auth-page";
import { Alert, PageHeader } from "@/components/ui";

export default async function PaymentsPage() {
  await requirePageRole(["PAYMENT_AGENT"]);
  return (
    <>
      <PageHeader title="Paiements" />
      <Alert kind="info">Paiements et reçus — disponibles au Sprint 3.</Alert>
    </>
  );
}
