import { RegisterForm } from "@/components/RegisterForm";
import { Card } from "@/components/ui";

export const metadata = { title: "Créer un compte · Calma WorkSpace" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <h1 className="mb-1 text-2xl font-semibold text-brand-900">Créer un compte</h1>
        <p className="mb-6 text-sm text-gray-600">Inscrivez-vous pour pouvoir réserver une salle.</p>
        <RegisterForm />
      </Card>
    </div>
  );
}
