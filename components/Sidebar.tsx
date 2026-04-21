"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  Settings,
  FileText,
  Target,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dossiers", label: "Dossiers AGEFICE", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/formations", label: "Formations", icon: BookOpen },
  { href: "/leads", label: "Prospection", icon: Target },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">AIssociate</p>
            <p className="text-xs text-gray-500">Gestion AGEFICE</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-800 border border-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} AIssociate SARL
        </p>
        <p className="text-xs text-gray-400">Qualiopi n°814211-1</p>
      </div>
    </aside>
  );
}
