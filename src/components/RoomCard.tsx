import { Badge, Card } from "./ui";
import { ROOM_TYPE_LABELS } from "@/lib/roles";
import type { RoomDTO } from "@/lib/rooms";

export function EquipmentChips({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-500">Aucun équipement renseigné</p>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Équipements">
      {items.map((e) => (
        <li key={e}>
          <Badge>{e}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function RoomCard({ room }: { room: Pick<RoomDTO, "name" | "type" | "capacity" | "equipment"> }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-brand-900">{room.name}</h3>
        <Badge tone="brand">{ROOM_TYPE_LABELS[room.type]}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Capacité : {room.capacity} {room.capacity > 1 ? "personnes" : "personne"}
      </p>
      <div className="mt-3">
        <EquipmentChips items={room.equipment} />
      </div>
    </Card>
  );
}
