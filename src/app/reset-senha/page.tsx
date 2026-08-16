'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';

function ResetSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token inválido ou ausente.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir a senha.');
      }

      setSucesso(true);
      toast.success('Senha atualizada com sucesso!');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-red-500 font-semibold">Link inválido ou ausente.</p>
        <Link href="/esqueci-senha" className="text-[#004B87] hover:underline">Solicitar um novo link</Link>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-green-600 font-semibold">Sua senha foi redefinida com sucesso!</p>
        <Button onClick={() => router.push('/login')} className="w-full bg-[#009A44] hover:bg-[#007f38]">
          Fazer Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova Senha</Label>
        <Input 
          id="password" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          minLength={6}
          maxLength={72}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
        <Input 
          id="confirmPassword" 
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required 
          minLength={6}
          maxLength={72}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-[#004B87] hover:bg-[#003666] text-white transition-colors h-11 text-base font-bold"
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Atualizar Senha'}
      </Button>
    </form>
  );
}

export default function ResetSenhaPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-t-4 border-t-[#004B87] shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#004B87]/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-[#004B87]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Criar Nova Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo para redefinir o acesso.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Suspense fallback={<p className="text-center">Carregando...</p>}>
            <ResetSenhaForm />
          </Suspense>
        </CardContent>

        <CardFooter className="flex flex-col text-center border-t pt-6">
          <Link href="/login" className="flex items-center justify-center gap-2 text-slate-600 hover:text-[#004B87] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
