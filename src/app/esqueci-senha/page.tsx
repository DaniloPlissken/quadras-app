'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);

  const handleMascaraCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação.');
      }

      setEmailEnviado(data.email);
      toast.success('Link de recuperação enviado com sucesso!');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-t-4 border-t-[#004B87] shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#004B87]/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-[#004B87]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Recuperar Senha</CardTitle>
          <CardDescription>
            {emailEnviado 
              ? 'Verifique sua caixa de entrada.' 
              : 'Informe seu CPF para receber o link de redefinição.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {emailEnviado ? (
            <div className="text-center space-y-4">
              <p className="text-slate-600 text-sm">
                Enviamos um link de recuperação para o e-mail:
                <br />
                <strong className="text-slate-900 mt-2 block">{emailEnviado}</strong>
              </p>
              <p className="text-slate-500 text-xs">
                O link expira em 1 hora. Não esqueça de checar sua caixa de spam ou lixeira.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">Seu CPF</Label>
                <Input 
                  id="cpf" 
                  placeholder="000.000.000-00" 
                  value={cpf}
                  onChange={(e) => setCpf(handleMascaraCPF(e.target.value))}
                  required 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#004B87] hover:bg-[#003666] text-white transition-colors h-11 text-base font-bold"
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Enviar Link de Recuperação'}
              </Button>
            </form>
          )}
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
