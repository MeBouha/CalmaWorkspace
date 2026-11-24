"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Field, Input } from "./ui";
import { fetchJson } from "@/lib/fetch-json";

type Settings = { openingTime: string; closingTime: string; maxDurationMinutes: number; bufferMinutes: number };

export function SettingsForm({ initial }: { initial: Settings }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const res = await fetchJson<{ settings: Settings }>("/api/manager/settings", {
      method: "PATCH",
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    setFieldErrors({});
    setSuccess(true);
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {success && <Alert kind="success">Paramètres enregistrés.</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heure d'ouverture" name="openingTime" error={fieldErrors.openingTime}>
            <Input name="openingTime" type="time" defaultValue={initial.openingTime} required error={fieldErrors.openingTime} />
          </Field>
          <Field label="Heure de fermeture" name="closingTime" error={fieldErrors.closingTime}>
            <Input name="closingTime" type="time" defaultValue={initial.closingTime} required error={fieldErrors.closingTime} />
          </Field>
          <Field label="Durée maximale (minutes)" name="maxDurationMinutes" error={fieldErrors.maxDurationMinutes}>
            <Input name="maxDurationMinutes" type="number" min={1} defaultValue={initial.maxDurationMinutes} required error={fieldErrors.maxDurationMinutes} />
          </Field>
          <Field
            label="Temps tampon (minutes)"
            name="bufferMinutes"
            error={fieldErrors.bufferMinutes}
            hint="Battement entre deux réservations d'une même salle."
          >
            <Input name="bufferMinutes" type="number" min={0} defaultValue={initial.bufferMinutes} required error={fieldErrors.bufferMinutes} />
          </Field>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
