'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <header className="w-full font-sans sticky top-0 z-50">
      {/* Thin accent stripe */}
      <div className="h-1 bg-gradient-to-r from-[#004B87] via-[#009A44] to-[#FFCD00]" />

      {/* Main bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          {/* Left: Logo + FUTEL label */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo-prefeitura.png"
              alt="Prefeitura de Uberlândia"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] font-bold tracking-wider text-[#004B87] uppercase">
                FUTEL
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Portal de Quadras
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/', label: 'Início' },
              { href: '/reservas', label: 'Agendar Quadras' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-[#004B87] hover:bg-blue-50/60 transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#004B87] hover:bg-blue-50/60 transition-all duration-200"
              >
                Painel Admin
              </Link>
            )}
          </nav>

          {/* Right: User area */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              /* Logged in user */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-[#004B87] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {userInitial}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">
                      {userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isAdmin ? 'Administrador' : 'Cidadão'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden md:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{session.user.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/admin"
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
              /* Not logged in */
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#004B87] border border-[#004B87]/20 hover:bg-[#004B87] hover:text-white transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <nav className="px-4 py-3 space-y-1">
              {[
                { href: '/', label: 'Início' },
                { href: '/reservas', label: 'Agendar Quadras' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-[#004B87] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-[#004B87] hover:bg-blue-50 transition-colors"
                >
                  Painel Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
