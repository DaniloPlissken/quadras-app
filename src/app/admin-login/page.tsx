'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LockKeyhole } from 'lucide-react';

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
    <main className="min-h-screen flex items-center justify-center bg-[#004B87] p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <LockKeyhole className="w-7 h-7 text-[#004B87]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Administração FUTEL</CardTitle>
          <CardDescription>
            Acesso exclusivo para servidores
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">E-mail Institucional</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="admin@futel.mg.gov.br" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-slate-50 h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-slate-50 h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#009A44] hover:bg-[#007f38] text-white transition-colors h-12 text-base font-bold shadow-md"
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'Acessar Painel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
