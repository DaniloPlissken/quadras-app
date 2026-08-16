'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User } from 'lucide-react';

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', cpf: '', telefone: '', password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    // Máscara de CPF
    if (name === 'cpf') {
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    }

    // Máscara de Telefone
    if (name === 'telefone') {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
      } else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      } else {
        value = value.replace(/^(\d*)/, '($1');
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefone.replace(/\D/g, '').length < 10) {
      toast.error('Telefone inválido.');
      return;
    }

    if (formData.password.trim().length === 0) {
      toast.error('A senha não pode ser vazia ou composta apenas por espaços.');
      return;
    }

    const tamanhoEmBytes = new Blob([formData.password]).size;
    if (tamanhoEmBytes > 72) {
      toast.error('Sua senha excedeu o limite máximo de 72 bytes (caracteres especiais ocupam mais espaço).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro');
      }

      toast.success('Cadastro realizado com sucesso!');
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 bg-slate-50 flex justify-center items-start">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-[#004B87]">
        <CardHeader className="text-center pb-8 border-b">
          <CardTitle className="text-3xl font-bold text-slate-800">Cadastro de Cidadão</CardTitle>
          <CardDescription className="text-base mt-2">
            Preencha seus dados para ter acesso às reservas das quadras da FUTEL.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* DADOS PESSOAIS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#004B87] font-semibold text-lg border-b pb-2">
                <User className="w-5 h-5" />
                <h3>Dados Pessoais</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp *</Label>
                    <Input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} maxLength={72} />
                  <p className="text-xs text-slate-500">Máximo de 72 bytes permitidos.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t">
              <Link href="/login" className="text-slate-600 hover:text-[#004B87] font-medium transition-colors">
                Já possuo cadastro
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 bg-[#009A44] hover:bg-[#007f38] text-white font-bold h-12 text-lg"
              >
                {loading ? 'Processando...' : 'Finalizar Cadastro'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </main>
  );
}
