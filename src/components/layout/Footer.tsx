'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full bg-[#004B87] border-t-[5px] border-[#FFD100] text-white pt-10 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 pb-10">
        
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-[16px] text-[#00A0E3] uppercase tracking-wide">
            ENDEREÇO
          </h3>
          <div className="h-[2px] bg-[#FFD100] w-full" />
          <div className="text-[13px] text-white font-bold uppercase leading-relaxed space-y-2 mt-2">
            <p>FUNDAÇÃO UBERLANDENSE DO TURISMO, ESPORTE E LAZER</p>
            <p>
              PARQUE DO SABIÁ – AV. JOSÉ ROBERTO MIGLIORINI, 850<br />
              (EM FRENTE AO ESTACIONAMENTO DA ARENA SABIAZINHO)<br />
              UBERLÂNDIA - MG
            </p>
          </div>
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-[16px] text-[#00A0E3] uppercase tracking-wide">
            CONTATO
          </h3>
          <div className="h-[2px] bg-[#FFD100] w-full" />
          <div className="flex flex-col gap-3 text-[13px] text-white font-bold uppercase mt-2">
            <p className="text-[26px] font-black tracking-tighter mt-1">
              (34) 3235-6165
            </p>
            <p className="mt-2">
              E-MAIL - <Link href="mailto:futel@uberlandia.mg.gov.br" className="text-[#FFD100] hover:underline underline-offset-4 cursor-pointer">FUTEL@UBERLANDIA.MG.GOV.BR</Link>
            </p>
          </div>
        </div>

        {/* Links Rápidos & Logo */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-[16px] text-[#00A0E3] uppercase tracking-wide">
            LINKS RÁPIDOS
          </h3>
          <div className="h-[2px] bg-[#FFD100] w-full" />
          <ul className="flex flex-col gap-3 text-[13px] text-white font-bold uppercase mt-2 mb-6">
            <li><a href="https://www.uberlandia.mg.gov.br/prefeitura/orgaos-municipais/futel/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD100] hover:underline underline-offset-4 transition-colors">Página Inicial</a></li>
            <li><Link href="/reservas" className="hover:text-[#FFD100] hover:underline underline-offset-4 transition-colors">Agendamento de Quadras</Link></li>
          </ul>

          <div className="mt-auto flex flex-col pt-4">
            <span className="font-bold text-[14px] leading-tight text-[#00A0E3] uppercase tracking-wider">PREFEITURA DE</span>
            <span className="font-black text-[22px] leading-tight text-white uppercase tracking-wider">UBERLÂNDIA</span>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="w-full bg-[#003666] py-4 text-center text-[11px] text-[#00A0E3] font-bold uppercase px-4 border-t border-[#002b52]">
        <p>© {new Date().getFullYear()} PREFEITURA MUNICIPAL DE UBERLÂNDIA - TODOS OS DIREITOS RESERVADOS.</p>
      </div>
    </footer>
  );
}
