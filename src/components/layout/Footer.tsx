import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#004B87] text-white pt-12 pb-6 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Logo and Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight text-[#FFCD00]">PREFEITURA DE</span>
            <span className="font-black text-2xl leading-tight text-white">UBERLÂNDIA</span>
          </div>
          <p className="text-sm text-gray-200 mt-2 max-w-sm">
            Fundação Uberlandense do Turismo, Esporte e Lazer (FUTEL)
          </p>
          <p className="text-sm text-gray-300">
            Av. José Roberto Migliorini, s/n - Santa Mônica<br />
            Parque do Sabiá<br />
            Uberlândia - MG
          </p>
        </div>

        {/* Links Rápidos */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-lg text-[#FFCD00] mb-2">Links Rápidos</h3>
          <ul className="flex flex-col gap-2 text-sm text-gray-200">
            <li><Link href="/" className="hover:text-white transition-colors">Página Inicial</Link></li>
            <li><Link href="/reservas" className="hover:text-white transition-colors">Agendamento de Quadras</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Portal da Transparência</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Ouvidoria</Link></li>
          </ul>
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-lg text-[#FFCD00] mb-2">Contato</h3>
          <ul className="flex flex-col gap-2 text-sm text-gray-200">
            <li>Telefone: (34) 3235-6289</li>
            <li>E-mail: futel@uberlandia.mg.gov.br</li>
            <li>Atendimento: Segunda a Sexta, 08h às 17h</li>
          </ul>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="mt-12 pt-6 border-t border-white/20 text-center text-xs text-gray-300 px-4">
        <p>© {new Date().getFullYear()} Prefeitura Municipal de Uberlândia - Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
