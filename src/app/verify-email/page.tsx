'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediAILogo from '@/components/layout/mediai-logo';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorType, setErrorType] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        setStatus('error');
        setErrorType('missing_params');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?token=${token}&type=${type}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verificado com sucesso!');
          
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setErrorType(data.error || 'unknown');
          setMessage(data.message || 'Erro ao verificar email');
        }
      } catch (error) {
        console.error('Erro na verificação:', error);
        setStatus('error');
        setErrorType('network_error');
        setMessage('Erro de conexão. Tente novamente.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const getErrorMessage = () => {
    if (message) return message;
    
    switch (errorType) {
      case 'missing_params':
        return 'Link de verificação incompleto. Verifique se copiou o link completo do email.';
      case 'invalid':
        return 'Token de verificação inválido ou já utilizado. Se você já verificou seu email anteriormente, pode fazer login normalmente.';
      case 'expired':
        return 'Token de verificação expirado. Faça login novamente para receber um novo link.';
      case 'user_not_found':
        return 'Usuário não encontrado. Entre em contato com o suporte.';
      case 'server_error':
        return 'Erro no servidor. Tente novamente mais tarde.';
      case 'network_error':
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      default:
        return 'Token inválido ou expirado. Tente fazer login novamente.';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 selection:bg-cyan-500 selection:text-white">
        <div className="mb-8">
          <Link href="/">
            <MediAILogo size="lg" />
          </Link>
        </div>
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5 text-center">
          <Loader2 className="w-16 h-16 text-cyan-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-cyan-900 mb-2">
            Verificando Email...
          </h2>
          <p className="text-slate-600 text-sm">
            Aguarde enquanto autenticamos seu link com segurança.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 selection:bg-cyan-500 selection:text-white">
        <div className="mb-8">
          <Link href="/">
            <MediAILogo size="lg" />
          </Link>
        </div>
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-cyan-900 mb-2">
            Email Verificado com Sucesso!
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            {message || 'Seu cadastro está confirmado. Redirecionando para o login em instantes...'}
          </p>
          <Button
            asChild
            className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 border-0"
          >
            <Link href="/login?verified=true">
              Ir para o Login Agora
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 selection:bg-cyan-500 selection:text-white">
      <div className="mb-8">
        <Link href="/">
          <MediAILogo size="lg" />
        </Link>
      </div>
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-600">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-cyan-900 mb-2">
          Erro na Verificação
        </h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {getErrorMessage()}
        </p>
        
        {errorType === 'expired' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-1 text-amber-900 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Link Expirado</span>
            </div>
            <p className="text-xs text-amber-800">
              Faça login para receber um novo e-mail de verificação atualizado.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            asChild
            className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 border-0"
          >
            <Link href="/login">
              Voltar para o Login
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <Link href="/">
              Voltar para a Página Inicial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
        <div className="mb-8">
          <MediAILogo size="lg" />
        </div>
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-900/5 text-center">
          <Loader2 className="w-16 h-16 text-cyan-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-cyan-900 mb-2">
            Carregando...
          </h2>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
