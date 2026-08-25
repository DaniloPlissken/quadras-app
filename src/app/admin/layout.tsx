import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

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
    <AdminLayoutShell
      sidebar={
        <>
          <SidebarNav />
          <div className="p-4 mt-auto border-t border-white/10 shrink-0 flex flex-col gap-2">
            <Link 
              href="/"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Link>
            <LogoutButton />
          </div>
        </>
      }
    >
      {children}
    </AdminLayoutShell>
  );
}
