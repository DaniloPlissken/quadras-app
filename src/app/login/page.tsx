'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMascaraCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      cpf,
      password,
    });

    setLoading(false);

    if (res?.error) {
      toast.error('Erro de autenticação', { description: res.error });
    } else {
      toast.success('Login efetuado com sucesso!');
      router.push('/reservas');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 relative">
      {/* Card Central */}
      <div className="relative w-full max-w-[500px] bg-white pt-16 pb-10 px-8 sm:px-12 shadow-xl mx-4 mt-16 border border-slate-200">
        {/* Header Azul sobreposto */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#005191] py-4 shadow-lg rounded-sm">
          <h2 className="text-center text-white text-xl sm:text-2xl font-bold">Entrar</h2>
        </div>
        
        <form onSubmit={handleLogin} className="mt-4 space-y-10">
          <div className="space-y-1">
            <input 
              id="cpf" 
              type="text"
              placeholder="CPF (somente números)" 
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(handleMascaraCPF(e.target.value))}
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
            <Link href="/esqueci-senha" className="text-sm text-[#6b8eaa] hover:text-[#005191] hover:underline transition-colors font-medium">
              Esqueci a Senha
            </Link>
          </div>

          <div className="flex justify-between items-center pt-4 gap-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => router.push('/cadastro')}
              className="w-1/2 border-gray-400 text-[#005191] font-bold h-12 rounded-sm hover:bg-slate-50 transition-colors"
            >
              CADASTRAR
            </Button>
            <Button 
              type="submit" 
              className="w-1/2 bg-[#005191] hover:bg-[#003d6e] text-white font-bold h-12 rounded-sm transition-colors"
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'ENTRAR'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
