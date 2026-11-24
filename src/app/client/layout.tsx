import { requirePageRole } from "@/lib/auth-page";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(["CLIENT"]);
  return <>{children}</>;
}
