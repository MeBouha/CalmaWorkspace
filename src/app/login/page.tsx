import { LoginForm } from "@/components/LoginForm";
import { Card } from "@/components/ui";

export const metadata = { title: "Connexion · Calma WorkSpace" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <h1 className="mb-6 text-2xl font-semibold text-brand-900">Connexion</h1>
        <LoginForm next={next} />
      </Card>
    </div>
  );
}
