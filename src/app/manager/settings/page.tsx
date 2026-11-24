import { SettingsForm } from "@/components/SettingsForm";
import { PageHeader } from "@/components/ui";
import { getCenterSettings } from "@/lib/settings";

export const metadata = { title: "Paramètres · Calma WorkSpace" };

export default async function SettingsPage() {
  const s = await getCenterSettings();
  return (
    <>
      <PageHeader title="Paramètres du centre" subtitle="Ces règles encadrent toutes les réservations." />
      <SettingsForm
        initial={{
          openingTime: s.openingTime,
          closingTime: s.closingTime,
          maxDurationMinutes: s.maxDurationMinutes,
          bufferMinutes: s.bufferMinutes,
        }}
      />
    </>
  );
}
