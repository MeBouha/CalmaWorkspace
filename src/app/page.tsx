import Link from "next/link";

const SPACES = [
  { title: "Salles individuelles", text: "Un espace calme pour réviser ou se concentrer." },
  { title: "Travail en groupe", text: "Des salles multi-personnes pour avancer ensemble." },
  { title: "Réunions", text: "Projecteur, tableau blanc et visioconférence." },
  { title: "Formations", text: "Des salles équipées jusqu'à 20 participants." },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-14 text-white sm:px-12">
        <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">Un espace calme pour travailler, réviser et se réunir.</h1>
        <p className="mt-4 max-w-xl text-brand-100">
          Calma WorkSpace accueille étudiants, élèves, développeurs et entrepreneurs dans des salles adaptées à chaque besoin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Créer un compte
          </Link>
          <Link href="/login" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Se connecter
          </Link>
        </div>
      </section>
      <section aria-labelledby="spaces-title">
        <h2 id="spaces-title" className="mb-4 text-xl font-semibold text-brand-900">Nos espaces</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPACES.map((s) => (
            <li key={s.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-medium text-brand-700">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
