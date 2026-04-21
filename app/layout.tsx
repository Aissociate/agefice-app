import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIssociate - Gestion AGEFICE",
  description: "Application de gestion des demandes AGEFICE pour AIssociate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-50">{children}</body>
    </html>
  );
}
