"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Field, Input, Select } from "./ui";
import { fetchJson } from "@/lib/fetch-json";
import { CLIENT_TYPES, CLIENT_TYPE_LABELS } from "@/lib/roles";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Les mots de passe ne correspondent pas." });
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetchJson<{ redirectTo: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    router.push(res.data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Nom complet" name="fullName" error={fieldErrors.fullName}>
        <Input name="fullName" autoComplete="name" required error={fieldErrors.fullName} />
      </Field>
      <Field label="Email" name="email" error={fieldErrors.email}>
        <Input name="email" type="email" autoComplete="email" required error={fieldErrors.email} />
      </Field>
      <Field label="Profil" name="clientType" error={fieldErrors.clientType}>
        <Select name="clientType" required defaultValue="" error={fieldErrors.clientType}>
          <option value="" disabled>
            Choisissez votre profil
          </option>
          {CLIENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CLIENT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Mot de passe"
        name="password"
        error={fieldErrors.password}
        hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
      >
        <Input name="password" type="password" autoComplete="new-password" required error={fieldErrors.password} />
      </Field>
      <Field label="Confirmer le mot de passe" name="confirmPassword" error={fieldErrors.confirmPassword}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required error={fieldErrors.confirmPassword} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
