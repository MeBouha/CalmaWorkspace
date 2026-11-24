import { AvailabilitySearch } from "@/components/AvailabilitySearch";
import { PageHeader } from "@/components/ui";
import { getCenterSettings } from "@/lib/settings";

export const metadata = { title: "Disponibilités · Calma WorkSpace" };

export default async function AvailabilityPage() {
  const s = await getCenterSettings();
  return (
    <>
      <PageHeader title="Salles disponibles" subtitle="Choisissez une date, un créneau et le nombre de personnes." />
      <AvailabilitySearch
        rules={{
          openingTime: s.openingTime,
          closingTime: s.closingTime,
          maxDurationMinutes: s.maxDurationMinutes,
          bufferMinutes: s.bufferMinutes,
        }}
      />
    </>
  );
}
