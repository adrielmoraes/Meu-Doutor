
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorType, setErrorType] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const type = searchParams.get('type');

    console.log('📧 Página de verificação:', { success, error, type });

    if (success === 'true') {
      setStatus('success');
      // Redirecionar após 3 segundos
      setTimeout(() => {
        if (type === 'patient') {
          router.push('/login?verified=true');
        } else if (type === 'doctor') {
          router.push('/login?verified=true');
        } else {
          router.push('/login');
        }
      }, 3000);
    } else if (error) {
      setStatus('error');
      setErrorType(error);
    }
  }, [searchParams, router]);

  const getErrorMessage = () => {
    switch (errorType) {
      case 'missing_params':
        return 'Link de verificação incompleto. Verifique se copiou o link completo do email.';
      case 'invalid':
        return 'Token de verificação inválido. O link pode ter sido usado anteriormente.';
      case 'expired':
        return 'Token de verificação expirado. Solicite um novo email de verificação.';
      case 'user_not_found':
        return 'Usuário não encontrado. Entre em contato com o suporte.';
      case 'server_error':
        return 'Erro no servidor. Tente novamente mais tarde.';
      default:
        return 'Token inválido ou expirado';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Verificando Email...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Aguarde enquanto verificamos seu email
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Email Verificado com Sucesso!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Seu email foi verificado. Você será redirecionado para o login em alguns segundos...
          </p>
          <Button
            onClick={() => router.push('/login?verified=true')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Erro na Verificação
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {getErrorMessage()}
        </p>
        
        {errorType === 'expired' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Faça login novamente para receber um novo email de verificação.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Voltar para Login
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Voltar para Início
          </Button>
        </div>
      </div>
    </div>
  );
}
