'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

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
    <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-t-4 border-t-[#004B87] shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#004B87]/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#004B87]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Acesso Restrito</CardTitle>
          <CardDescription>
            Portal de Serviços - FUTEL Uberlândia
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input 
                id="cpf" 
                placeholder="000.000.000-00" 
                value={cpf}
                onChange={(e) => setCpf(handleMascaraCPF(e.target.value))}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#009A44] hover:bg-[#007f38] text-white transition-colors h-11 text-base font-bold"
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-slate-600 border-t pt-6">
          <p>
            Ainda não tem cadastro?{' '}
            <Link href="/cadastro" className="text-[#004B87] font-semibold hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
