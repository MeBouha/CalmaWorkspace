"use client";

import { useState, type FormEvent } from "react";
import { Alert, Badge, Button, Card, Field, Input, Select } from "./ui";
import { fetchJson } from "@/lib/fetch-json";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserDTO } from "@/lib/users";

export function AgentsManager({ initialAgents }: { initialAgents: UserDTO[] }) {
  const [agents, setAgents] = useState(initialAgents);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetchJson<{ agent: UserDTO }>("/api/manager/agents", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(formEl))),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    setFieldErrors({});
    setAgents((a) => [res.data.agent, ...a]);
    setSuccess(`Compte créé pour ${res.data.agent.fullName}. Communiquez-lui son mot de passe temporaire.`);
    formEl.reset();
  }

  async function toggle(agent: UserDTO) {
    setBusyId(agent.id);
    setError(null);
    setSuccess(null);
    const action = agent.active ? "deactivate" : "reactivate";
    const res = await fetchJson<{ agent: UserDTO }>(`/api/manager/agents/${agent.id}/${action}`, { method: "PATCH" });
    setBusyId(null);
    if (!res.ok) return setError(res.error);
    setAgents((list) => list.map((a) => (a.id === agent.id ? res.data.agent : a)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <Card>
        <h2 className="mb-4 font-semibold text-brand-900">Nouvel agent</h2>
        <form onSubmit={onCreate} noValidate className="space-y-4">
          <Field label="Nom complet" name="fullName" error={fieldErrors.fullName}>
            <Input name="fullName" required error={fieldErrors.fullName} />
          </Field>
          <Field label="Email" name="email" error={fieldErrors.email}>
            <Input name="email" type="email" required error={fieldErrors.email} />
          </Field>
          <Field label="Rôle" name="role" error={fieldErrors.role}>
            <Select name="role" defaultValue="FOLLOW_UP_AGENT" error={fieldErrors.role}>
              <option value="FOLLOW_UP_AGENT">{ROLE_LABELS.FOLLOW_UP_AGENT}</option>
              <option value="PAYMENT_AGENT">{ROLE_LABELS.PAYMENT_AGENT}</option>
            </Select>
          </Field>
          <Field
            label="Mot de passe temporaire"
            name="temporaryPassword"
            error={fieldErrors.temporaryPassword}
            hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
          >
            <Input name="temporaryPassword" type="text" autoComplete="off" required error={fieldErrors.temporaryPassword} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Création…" : "Créer le compte"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {success && <Alert kind="success">{success}</Alert>}
        {agents.length === 0 ? (
          <Alert kind="info">Aucun agent pour le moment.</Alert>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Liste des agents</caption>
              <thead className="border-b border-gray-200 bg-sand-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Nom</th>
                  <th scope="col" className="px-4 py-3 font-medium">Rôle</th>
                  <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.fullName}</div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABELS[a.role]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.active ? "green" : "gray"}>{a.active ? "Actif" : "Désactivé"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={a.active ? "danger" : "secondary"}
                        disabled={busyId === a.id}
                        onClick={() => toggle(a)}
                        aria-label={`${a.active ? "Désactiver" : "Réactiver"} ${a.fullName}`}
                      >
                        {a.active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
