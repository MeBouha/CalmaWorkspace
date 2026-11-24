"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Alert, Button, Field, Input, Select } from "./ui";
import { RoomCard } from "./RoomCard";
import { fetchJson } from "@/lib/fetch-json";
import type { RoomDTO } from "@/lib/rooms";

type Rules = { openingTime: string; closingTime: string; maxDurationMinutes: number; bufferMinutes: number };

const DURATIONS = [30, 60, 90, 120, 180, 240, 300, 360, 480];

function formatDuration(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h === 0 ? `${r} min` : r === 0 ? `${h} h` : `${h} h ${r}`;
}

export function AvailabilitySearch({ rules }: { rules: Rules }) {
  const [rooms, setRooms] = useState<RoomDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const durations = DURATIONS.filter((d) => d <= rules.maxDurationMinutes);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(
      Object.entries(Object.fromEntries(new FormData(e.currentTarget))).map(([k, v]) => [k, String(v)]),
    );
    setPending(true);
    setError(null);
    setFieldErrors({});
    const res = await fetchJson<{ rooms: RoomDTO[] }>(`/api/availability?${params}`);
    setPending(false);
    if (!res.ok) {
      setRooms(null);
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    setRooms(res.data.rooms);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Date" name="date" error={fieldErrors.date}>
          <Input name="date" type="date" min={today} defaultValue={today} required error={fieldErrors.date} />
        </Field>
        <Field label="Heure de début" name="startTime" error={fieldErrors.startTime}>
          <Input
            name="startTime"
            type="time"
            step={900}
            min={rules.openingTime}
            max={rules.closingTime}
            defaultValue="10:00"
            required
            error={fieldErrors.startTime}
          />
        </Field>
        <Field label="Durée" name="durationMinutes" error={fieldErrors.durationMinutes}>
          <Select name="durationMinutes" defaultValue="60" error={fieldErrors.durationMinutes}>
            {durations.map((d) => (
              <option key={d} value={d}>
                {formatDuration(d)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nombre de personnes" name="participants" error={fieldErrors.participants}>
          <Input name="participants" type="number" min={1} defaultValue={1} required error={fieldErrors.participants} />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Recherche…" : "Rechercher"}
        </Button>
      </form>

      <p className="text-sm text-gray-600">
        Horaires d&apos;ouverture : {rules.openingTime} – {rules.closingTime} · durée maximale {formatDuration(rules.maxDurationMinutes)}.
      </p>

      <section aria-live="polite" aria-label="Résultats">
        {error && <Alert>{error}</Alert>}
        {rooms && rooms.length === 0 && (
          <Alert kind="info">Aucune salle disponible pour ce créneau. Essayez un autre horaire ou une autre date.</Alert>
        )}
        {rooms && rooms.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-semibold text-brand-900">
              {rooms.length} salle{rooms.length > 1 ? "s" : ""} disponible{rooms.length > 1 ? "s" : ""}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => (
                <li key={r.id}>
                  <RoomCard room={r} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
