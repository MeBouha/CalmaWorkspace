import { requirePageRole } from "@/lib/auth-page";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(["MANAGER"]);
  return <>{children}</>;
}
