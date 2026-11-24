import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-page";
import { ROLE_HOME } from "@/lib/roles";

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-2xl font-semibold text-brand-900">Accès non autorisé</h1>
      <p className="mt-2 text-gray-600">Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.</p>
      <Link
        href={user ? ROLE_HOME[user.role] : "/login"}
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {user ? "Retour à mon espace" : "Se connecter"}
      </Link>
    </div>
  );
}
