'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <header className="w-full font-sans sticky top-0 z-50 bg-white">
      {/* Barra Azul Superior (Prefeitura) */}
      <div className="h-2.5 bg-[#004B87]" />

      {/* Main bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-stretch justify-between h-28">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center shrink-0 pr-6">
            <Image
              src="/logo-prefeitura-hd.png"
              alt="Prefeitura de Uberlândia"
              width={350}
              height={100}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Right side: Top utils + Main Nav */}
          <div className="hidden md:flex flex-col flex-1 justify-center">
            {/* Top Utils Spacer */}
            <div className="flex justify-end items-center pb-1 border-b border-slate-200 min-h-[24px]"></div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between pt-1.5">
              <nav className="flex items-center gap-6">
                {[
                  { href: '/', label: 'Início' },
                  { href: '/reservas', label: 'Agendar Quadras' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[13px] font-bold text-[#004B87] uppercase hover:text-[#00A0E3] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin/agenda-semanal"
                    className="text-[13px] font-bold text-[#009A44] uppercase hover:text-[#007f38] transition-colors"
                  >
                    Painel Admin
                  </Link>
                )}
              </nav>

              {/* User area */}
              <div className="flex items-center gap-3 pl-6">
                {session?.user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#004B87] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {userInitial}
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-xs font-bold text-[#004B87] max-w-[120px] truncate uppercase">
                          {userName}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#004B87] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#004B87] hover:bg-[#003666] transition-all uppercase shadow-sm"
                  >
                    <User className="w-3.5 h-3.5" />
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-[#004B87] hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-in slide-in-from-top-2">

            <nav className="px-4 py-3 space-y-1">
              {[
                { href: '/', label: 'Início' },
                { href: '/reservas', label: 'Agendar Quadras' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-bold text-[#004B87] hover:bg-blue-50 uppercase"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin/agenda-semanal"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-bold text-[#009A44] hover:bg-green-50 uppercase"
                >
                  Painel Admin
                </Link>
              )}
            </nav>
            {/* Mobile Auth Button */}
            {!session?.user && (
              <div className="px-4 py-3 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[#004B87] hover:bg-[#003666] uppercase"
                >
                  <User className="w-4 h-4" />
                  Entrar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
