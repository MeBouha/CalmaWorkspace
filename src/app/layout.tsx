import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { getCurrentUser } from "@/lib/auth-page";

export const metadata: Metadata = {
  title: "Calma WorkSpace",
  description: "Espace de coworking et de révision : salles individuelles, de groupe, de réunion et de formation.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <NavBar user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
