
"use client";

import { useEffect, useState } from 'react';
import { useDaily, DailyVideo, useLocalSessionId } from '@daily-co/daily-react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Mic, Video as VideoIcon } from 'lucide-react';

interface HaircheckProps {
    onJoinCall: () => void;
}

export { Haircheck };

function Haircheck({ onJoinCall }: HaircheckProps) {
    const daily = useDaily();
    const localSessionId = useLocalSessionId();
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Iniciar câmera automaticamente detectando dispositivos padrão
    useEffect(() => {
        if (!daily || isReady) return;

        const startPreview = async () => {
            try {
                console.log('[Haircheck] Iniciando câmera...');
                
                // Iniciar câmera com dispositivos padrão (true = usar padrão do sistema)
                await daily.startCamera({
                    audioSource: true,
                    videoSource: true
                });
                
                console.log('[Haircheck] Câmera iniciada com sucesso');
                setIsReady(true);
                setError(null);
            } catch (err: any) {
                console.error('[Haircheck] Erro ao iniciar câmera:', err);
                setError('Não foi possível acessar câmera/microfone. Verifique as permissões.');
            }
        };

        // Pequeno delay para garantir que o Daily esteja totalmente carregado
        const timer = setTimeout(startPreview, 500);
        return () => clearTimeout(timer);
    }, [daily, isReady]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Configurar Câmera e Microfone
                </h2>

                {/* Preview de vídeo */}
                <div className="relative mb-6 bg-black rounded-lg overflow-hidden aspect-video">
                    {isReady && localSessionId ? (
                        <DailyVideo
                            sessionId={localSessionId}
                            type="video"
                            className="w-full h-full object-cover mirror"
                        />
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                            <p className="mb-4">{error}</p>
                            <p className="text-sm text-gray-400">
                                Permita o acesso à câmera e microfone nas configurações do navegador
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-white">
                                <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
                                <p className="text-sm">Preparando câmera e microfone...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Informações dos dispositivos */}
                {isReady && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-300 mb-2">
                            <Check className="h-5 w-5" />
                            <span className="font-semibold">Tudo pronto!</span>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                            <div className="flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                <span>Microfone detectado automaticamente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <VideoIcon className="h-4 w-4" />
                                <span>Câmera detectada automaticamente</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botão de entrar */}
                <Button
                    onClick={onJoinCall}
                    disabled={!isReady}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
                    size="lg"
                >
                    {isReady ? (
                        <>
                            <Check className="mr-2 h-5 w-5" />
                            Entrar na Consulta
                        </>
                    ) : (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Aguarde...
                        </>
                    )}
                </Button>

                {error && (
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="w-full mt-3"
                    >
                        Tentar Novamente
                    </Button>
                )}
            </div>
        </div>
    );
}
