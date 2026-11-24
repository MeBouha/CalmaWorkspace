"use client";

import { useState, type FormEvent } from "react";
import { Alert, Badge, Button, Card, Field, Input, Select } from "./ui";
import { EquipmentChips } from "./RoomCard";
import { fetchJson } from "@/lib/fetch-json";
import { ROOM_TYPES, ROOM_TYPE_LABELS } from "@/lib/roles";
import type { RoomDTO } from "@/lib/rooms";

export function RoomsManager({ initialRooms }: { initialRooms: RoomDTO[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editing, setEditing] = useState<RoomDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const body = Object.fromEntries(new FormData(formEl));
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetchJson<{ room: RoomDTO }>(
      editing ? `/api/manager/rooms/${editing.id}` : "/api/manager/rooms",
      { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) },
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    const room = res.data.room;
    setFieldErrors({});
    setRooms((list) => (editing ? list.map((r) => (r.id === room.id ? room : r)) : [...list, room]));
    setSuccess(editing ? `Salle « ${room.name} » modifiée.` : `Salle « ${room.name} » ajoutée.`);
    setEditing(null);
    formEl.reset();
  }

  async function toggle(room: RoomDTO) {
    setBusyId(room.id);
    setError(null);
    setSuccess(null);
    const res = await fetchJson<{ room: RoomDTO }>(`/api/manager/rooms/${room.id}/toggle-active`, { method: "PATCH" });
    setBusyId(null);
    if (!res.ok) return setError(res.error);
    setRooms((list) => list.map((r) => (r.id === room.id ? res.data.room : r)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <Card>
        <h2 className="mb-4 font-semibold text-brand-900">{editing ? `Modifier « ${editing.name} »` : "Nouvelle salle"}</h2>
        {/* key forces the uncontrolled inputs to reset when switching rooms */}
        <form key={editing?.id ?? "new"} onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Nom" name="name" error={fieldErrors.name}>
            <Input name="name" defaultValue={editing?.name} required error={fieldErrors.name} />
          </Field>
          <Field label="Type" name="type" error={fieldErrors.type}>
            <Select name="type" defaultValue={editing?.type ?? "INDIVIDUAL"} error={fieldErrors.type}>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Capacité (personnes)" name="capacity" error={fieldErrors.capacity}>
            <Input name="capacity" type="number" min={1} defaultValue={editing?.capacity ?? 1} required error={fieldErrors.capacity} />
          </Field>
          <Field label="Équipements" name="equipment" error={fieldErrors.equipment} hint="Séparés par des virgules, ex. : Wi-Fi, projecteur">
            <Input name="equipment" defaultValue={editing?.equipment.join(", ")} error={fieldErrors.equipment} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter la salle"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={() => { setEditing(null); setFieldErrors({}); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {success && <Alert kind="success">{success}</Alert>}
        {rooms.length === 0 && <Alert kind="info">Aucune salle. Ajoutez la première salle du centre.</Alert>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {rooms.map((r) => (
            <li key={r.id}>
              <Card className={r.active ? "" : "opacity-70"}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-900">{r.name}</h3>
                  <Badge tone={r.active ? "green" : "gray"}>{r.active ? "Active" : "Désactivée"}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {ROOM_TYPE_LABELS[r.type]} · {r.capacity} pers.
                </p>
                <div className="mt-3">
                  <EquipmentChips items={r.equipment} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => { setEditing(r); setFieldErrors({}); }} aria-label={`Modifier ${r.name}`}>
                    Modifier
                  </Button>
                  <Button
                    variant={r.active ? "danger" : "secondary"}
                    disabled={busyId === r.id}
                    onClick={() => toggle(r)}
                    aria-label={`${r.active ? "Désactiver" : "Réactiver"} ${r.name}`}
                  >
                    {r.active ? "Désactiver" : "Réactiver"}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
