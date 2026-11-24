import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { ROLE_LABELS, type RoleName } from "@/lib/roles";

const LINKS: Record<RoleName, { href: string; label: string }[]> = {
  CLIENT: [{ href: "/client/availability", label: "Disponibilités" }],
  MANAGER: [
    { href: "/manager/agents", label: "Agents" },
    { href: "/manager/rooms", label: "Salles" },
    { href: "/manager/settings", label: "Paramètres" },
  ],
  FOLLOW_UP_AGENT: [{ href: "/agent/planning", label: "Planning" }],
  PAYMENT_AGENT: [{ href: "/agent/payments", label: "Paiements" }],
};

type Props = { user: { fullName: string; role: RoleName } | null };

export function NavBar({ user }: Props) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <nav aria-label="Navigation principale" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white">C</span>
          Calma WorkSpace
        </Link>
        {user ? (
          <>
            <ul className="flex flex-wrap gap-1">
              {LINKS[user.role].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{user.fullName}</span>{" "}
                <span className="text-gray-500">· {ROLE_LABELS[user.role]}</span>
              </span>
              <LogoutButton />
            </div>
          </>
        ) : (
          <div className="ml-auto flex gap-2">
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
              Connexion
            </Link>
            <Link href="/register" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Créer un compte
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
