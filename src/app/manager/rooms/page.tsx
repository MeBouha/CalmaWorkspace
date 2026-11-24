import { RoomsManager } from "@/components/RoomsManager";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { toRoomDTO } from "@/lib/rooms";

export const metadata = { title: "Salles · Calma WorkSpace" };

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="Salles" subtitle="Ajoutez, modifiez et désactivez les salles du centre." />
      <RoomsManager initialRooms={rooms.map(toRoomDTO)} />
    </>
  );
}
