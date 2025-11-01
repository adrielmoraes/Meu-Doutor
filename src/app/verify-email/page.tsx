'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setStatus('error');
      setMessage('Link de verificação inválido.');
      return;
    }

    verifyEmail(token, type);
  }, [searchParams]);

  const verifyEmail = async (token: string, type: string) => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, type }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verificado com sucesso! Você já pode fazer login.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao verificar email.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro ao conectar com o servidor.');
    }
  };

  const handleGoToLogin = () => {
    const type = searchParams.get('type');
    if (type === 'patient') {
      router.push('/login/patient');
    } else if (type === 'doctor') {
      router.push('/login/doctor');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
         }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verificando email...'}
            {status === 'success' && 'Email Verificado!'}
            {status === 'error' && 'Erro na Verificação'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        {status !== 'loading' && (
          <CardContent className="flex justify-center">
            <Button
              onClick={handleGoToLogin}
              className="w-full max-w-xs"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {status === 'success' ? 'Ir para Login' : 'Voltar'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Carregando verificação...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
