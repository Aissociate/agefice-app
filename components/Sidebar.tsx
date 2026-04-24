"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  Settings,
  FileText,
  Target,
  Mail,
  CalendarDays,
  PenSquare,
  Globe,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",      label: "Tableau de bord",  icon: LayoutDashboard },
  { href: "/dossiers",       label: "Dossiers AGEFICE", icon: FolderOpen      },
  { href: "/clients",        label: "Clients",          icon: Users           },
  { href: "/formations",     label: "Formations",       icon: BookOpen        },
  { href: "/leads",          label: "Prospection",      icon: Target          },
  { href: "/calendrier",     label: "Calendrier",       icon: CalendarDays    },
  { href: "/contenu",        label: "Contenu",          icon: PenSquare       },
  { href: "/landing-pages",  label: "Landing Pages",    icon: Globe           },
  { href: "/parametres",     label: "Paramètres",       icon: Settings        },
];

type UnreadClient = { id: string; nom: string; prenom: string; count: number };

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadClients, setUnreadClients] = useState<UnreadClient[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/conversations/unread");
        const data = await res.json();
        if (data.clients?.length > 0) {
          setUnreadClients(data.clients);
          setAlertDismissed(false);
        } else {
          setUnreadClients([]);
        }
      } catch {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  const showAlert = unreadClients.length > 0 && !alertDismissed;

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

      {/* Alerte nouveaux mails */}
      {showAlert && (
        <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs">
          <div className="flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 mb-1">
                {unreadClients.reduce((s, c) => s + c.count, 0)} nouveau{unreadClients.reduce((s, c) => s + c.count, 0) > 1 ? "x" : ""} mail{unreadClients.reduce((s, c) => s + c.count, 0) > 1 ? "s" : ""}
              </p>
              <ul className="space-y-0.5">
                {unreadClients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-amber-700 hover:text-amber-900 underline truncate block"
                    >
                      {c.prenom} {c.nom}
                      {c.count > 1 && <span className="ml-1 text-amber-500">({c.count})</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="text-amber-400 hover:text-amber-600 leading-none shrink-0"
              title="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isClients = item.href === "/clients";
          const unreadTotal = unreadClients.reduce((s, c) => s + c.count, 0);
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
              <span className="flex-1">{item.label}</span>
              {isClients && unreadTotal > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadTotal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} AIssociate SARL</p>
        <p className="text-xs text-gray-400">Qualiopi n°814211-1</p>
      </div>
    </aside>
  );
}
