import Link from "next/link";
import { PageHeader } from "@/components/ui";

const SECTIONS = [
  { href: "/manager/agents", title: "Agents", text: "Créer et désactiver les comptes des agents de suivi et de paiement." },
  { href: "/manager/rooms", title: "Salles", text: "Ajouter, modifier et désactiver les salles du centre." },
  { href: "/manager/settings", title: "Paramètres", text: "Horaires d'ouverture, durée maximale et temps tampon." },
];

export default function ManagerHome() {
  return (
    <>
      <PageHeader title="Espace gérant" subtitle="Configurez le centre et gérez les accès." />
      <ul className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow">
              <h2 className="font-semibold text-brand-700">{s.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
