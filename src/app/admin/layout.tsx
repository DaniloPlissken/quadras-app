import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Map, Settings } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin-login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#004B87] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Admin FUTEL</h2>
          <p className="text-sm text-blue-200 mt-1">Parque do Sabiá</p>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <Link href="/admin" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/reservas" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors">
                <Map className="w-5 h-5" />
                <span>Gestão de Reservas</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/calendario" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors">
                <Calendar className="w-5 h-5" />
                <span>Calendário</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/quadras" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5" />
                <span>Quadras</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/times" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition-colors">
                <Users className="w-5 h-5" />
                <span>Times (Futebol)</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
