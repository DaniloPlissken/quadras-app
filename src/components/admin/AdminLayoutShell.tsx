"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminLayoutShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Previne rolagem do fundo quando menu aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const getPageTitle = () => {
    if (pathname.includes("/agenda-semanal")) return "Agenda";
    if (pathname.includes("/calendario")) return "Liberação de Horários";
    if (pathname.includes("/reservas")) return "Gestão de Reservas";
    if (pathname.includes("/times")) return "Gestão de Times";
    if (pathname.includes("/quadras")) return "Gestão de Quadras";
    return "Admin FUTEL";
  };

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden relative w-full">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#004B87] text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div>
          <h2 className="text-lg font-bold">{getPageTitle()}</h2>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#004B87] text-white flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col py-4 px-2 bg-white shrink-0 relative border-b-[4px] border-[#FFD100]">
          <div className="flex justify-center w-full">
            <Image
              src="/logo-prefeitura-hd.png"
              alt="Prefeitura de Uberlândia"
              width={350}
              height={100}
              className="h-20 md:h-24 w-auto object-contain max-w-full"
              priority
            />
          </div>
          <button 
            className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Sidebar content slot */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {sidebar}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0 w-full relative">
        {children}
      </main>
    </div>
  );
}
