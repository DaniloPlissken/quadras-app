"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarClock, Users, Map, Settings, ClipboardList } from "lucide-react";

const SoccerBallIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="12 8 16 11 14.5 15.5 9.5 15.5 8 11" />
    <line x1="12" y1="8" x2="12" y2="2" />
    <line x1="16" y1="11" x2="21.5" y2="8.5" />
    <line x1="14.5" y1="15.5" x2="17.5" y2="20.5" />
    <line x1="9.5" y1="15.5" x2="6.5" y2="20.5" />
    <line x1="8" y1="11" x2="2.5" y2="8.5" />
  </svg>
);

export function SidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/agenda-semanal", icon: Map, label: "Agenda" },
    { href: "/admin/reservas", icon: ClipboardList, label: "Gestão de Reservas" },
    { href: "/admin/calendario", icon: CalendarClock, label: "Liberação de Horários" },
    { href: "/admin/quadras", icon: Settings, label: "Gestão de Quadras" },
    { href: "/admin/times", icon: Users, label: "Cadastro de Times" },
  ];

  const reservasFutebolLink = { href: "/admin/reservas/futebol", icon: SoccerBallIcon, label: "Reserva de Campos" };

  const isLinkActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/admin/reservas" && pathname === "/admin/reservas/futebol") return false;
    if (pathname.startsWith(href + '/')) return true;
    return false;
  };

  return (
    <nav className="flex-1 py-4 flex flex-col justify-between">
      <ul className="space-y-1">
        {links.map((link) => {
          const isActive = isLinkActive(link.href);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive 
                    ? "bg-[#00407a] border-l-4 border-emerald-400" 
                    : "hover:bg-white/10 border-l-4 border-transparent text-slate-200 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Separated Section */}
      <div className="mb-4 mt-auto pt-6 border-t border-white/10">
        <ul className="space-y-1 mt-2">
          <li>
            <Link 
              href={reservasFutebolLink.href} 
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                pathname === reservasFutebolLink.href 
                  ? "bg-emerald-600/20 border-l-4 border-emerald-400" 
                  : "hover:bg-emerald-600/10 border-l-4 border-transparent text-slate-200 hover:text-white"
              }`}
            >
              <reservasFutebolLink.icon className={`w-5 h-5 ${pathname === reservasFutebolLink.href ? "text-emerald-400" : "text-emerald-500/80"}`} />
              <span className={`font-medium ${pathname === reservasFutebolLink.href ? "text-emerald-50" : "text-emerald-100/90"}`}>
                {reservasFutebolLink.label}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
