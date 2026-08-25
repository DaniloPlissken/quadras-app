'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      toast.error('Acesso Negado', { description: 'Credenciais administrativas inválidas.' });
    } else {
      toast.success('Bem-vindo ao Painel FUTEL!');
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 relative">
      {/* Logos no topo (Admin não tem header global) */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-start z-10">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col shrink-0 z-10 w-fit text-left">
            <span className="text-[28px] md:text-[34px] font-black text-[#009A44] leading-none">FUTEL</span>
            <span className="text-[9px] md:text-[11px] font-medium text-[#004B87] leading-[1.2] uppercase mt-0.5">
              FUNDAÇÃO UBERLANDENSE<br />DO TURISMO, ESPORTE E LAZER
            </span>
          </div>
        </div>
        <div className="w-48 sm:w-64">
          <img 
            src="/logo-prefeitura-hd.png" 
            alt="Prefeitura de Uberlândia" 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Card Central */}
      <div className="relative w-full max-w-[500px] bg-white pt-16 pb-10 px-8 sm:px-12 shadow-xl mx-4 mt-16 border border-slate-200">
        {/* Header Azul sobreposto */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#005191] py-4 shadow-lg rounded-sm">
          <h2 className="text-center text-white text-xl sm:text-2xl font-bold">Painel Administrativo</h2>
        </div>
        
        <form onSubmit={handleLogin} className="mt-4 space-y-10">
          <div className="space-y-1">
            <input 
              id="email" 
              type="email"
              placeholder="E-mail Institucional" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full bg-transparent border-0 border-b border-[#005191] text-center text-[#6b8eaa] text-lg font-medium pb-2 focus:ring-0 focus:outline-none focus:border-b-2 placeholder:text-[#6b8eaa]"
            />
          </div>
          
          <div className="space-y-1">
            <input 
              id="password" 
              type="password" 
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full bg-transparent border-0 border-b border-[#005191] text-center text-[#6b8eaa] text-lg font-medium pb-2 focus:ring-0 focus:outline-none focus:border-b-2 placeholder:text-[#6b8eaa]"
            />
          </div>

          <div className="flex justify-center -mt-2">
            <button type="button" className="text-sm text-[#6b8eaa] hover:text-[#005191] hover:underline transition-colors font-medium">
              Esqueci a Senha
            </button>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              className="w-full bg-[#005191] hover:bg-[#003d6e] text-white font-bold h-12 rounded-sm transition-colors"
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'ENTRAR'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
