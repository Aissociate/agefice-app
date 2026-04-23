"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullWidth = pathname === "/leads" || pathname.startsWith("/leads/");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      {isFullWidth ? (
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
        </main>
      )}
    </div>
  );
}
