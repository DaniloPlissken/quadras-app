'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = session?.user?.name || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const isAdmin = session?.user?.role === 'ADMIN';

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="w-full font-sans sticky top-0 z-50 bg-white">
      {/* Barra Azul Superior (Prefeitura) */}
      <div className="h-2.5 bg-[#004B87]" />

      {/* Main bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-20 md:h-28">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center shrink-0 z-10">
            <Image
              src="/logo-prefeitura-hd.png"
              alt="Prefeitura de Uberlândia"
              width={350}
              height={100}
              className="h-14 md:h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Center: Title (Hidden on mobile) */}
          <div className="hidden md:flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl font-black tracking-widest text-[#009A44] uppercase flex items-center gap-2">
              FUTEL
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Agendamento de Quadras
            </p>
          </div>

          {/* Right side: User area */}
          <div className="flex items-center gap-3 z-10">
            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-[#004B87] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {userInitial}
                  </div>
                  <div className="flex flex-col items-start leading-tight hidden sm:flex">
                    <span className="text-sm font-bold text-[#004B87] max-w-[150px] truncate uppercase">
                      {userName}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#004B87] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{session.user.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/admin/agenda-semanal"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#004B87] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Painel Admin
                      </Link>
                    )}

                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#004B87] hover:bg-[#003666] transition-all uppercase shadow-md"
              >
                <User className="w-4 h-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
