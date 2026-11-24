"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Field, Input } from "./ui";
import { fetchJson } from "@/lib/fetch-json";
import { canAccess, type RoleName } from "@/lib/roles";

type LoginResponse = { user: { role: RoleName }; redirectTo: string };

/** Only follow ?next= when it is a local path the user's role may open. */
function safeNext(next: string | undefined, role: RoleName): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return canAccess(next, role) ? next : null;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetchJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors);
      return;
    }
    router.push(safeNext(next, res.data.user.role) ?? res.data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Email" name="email" error={fieldErrors.email}>
        <Input name="email" type="email" autoComplete="email" required error={fieldErrors.email} />
      </Field>
      <Field label="Mot de passe" name="password" error={fieldErrors.password}>
        <Input name="password" type="password" autoComplete="current-password" required error={fieldErrors.password} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
