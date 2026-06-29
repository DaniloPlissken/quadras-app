'use client';

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/admin-login' })}
      className="flex items-center w-full gap-3 px-2 py-2 hover:bg-white/10 transition-colors rounded text-left"
    >
      <LogOut className="w-5 h-5" />
      <span>Sair do Painel</span>
    </button>
  );
}
