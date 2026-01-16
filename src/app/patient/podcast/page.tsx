'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Headphones, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
// Certifique-se que estas actions existem e apontam para a função 'generateHealthPodcast'
import { generatePodcastAction, getPodcastAction } from '@/components/patient/actions';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSessionOnClient } from '@/lib/session';

export default function HealthPodcastPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(true);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasNewExams, setHasNewExams] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [podcastDate, setPodcastDate] = useState<string | null>(null);
    const [podcastHistory, setPodcastHistory] = useState<Array<{ id: string; audioUrl: string; generatedAt: string }>>([]);
    const [loadingHintIndex, setLoadingHintIndex] = useState(0);
    const LOADING_HINTS = [
        "Preparando roteiro personalizado...",
        "Analisando seus últimos exames...",
        "Organizando recomendações práticas...",
        "Gerando áudio de alta qualidade...",
        "Finalizando seu episódio. Quase lá..."
    ];

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Função para carregar podcasts
    const loadPodcasts = async () => {
        try {
            // Obter sessão atual
            const session = await getSessionOnClient();

            if (!session?.userId) {
                setIsLoadingExisting(false);
                return;
            }

            // Buscar podcast salvo
            const result = await getPodcastAction(session.userId);

            if (result.success && result.latestPodcast) {
                setAudioUrl(result.latestPodcast.audioUrl);
                setPodcastDate(result.latestPodcast.generatedAt || null);
                // Lógica para verificar se há novos exames desde o último podcast
                // Se o backend retorna essa flag:
                setHasNewExams(!!result.hasNewExams);
                if (result.history) {
                    setPodcastHistory(result.history);
                }
            } else {
                // Sem podcast, habilitar geração
                setHasNewExams(true);
            }
        } catch (error) {
            console.error('Failed to load existing podcast:', error);
        } finally {
            setIsLoadingExisting(false);
        }
    };

    // Carregar podcast existente ao montar
    useEffect(() => {
        loadPodcasts();
    }, []);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Gerar novo podcast
    const handleGenerate = async () => {
        setIsLoading(true);

        try {
            const session = await getSessionOnClient();
            const userId = session?.userId;

            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            // Chama Server Action que internamente chama 'generateHealthPodcast'
            const result = await generatePodcastAction(userId);

            if (result.success && result.audioUrl) {
                // Atualiza a lista completa de podcasts após gerar um novo
                await loadPodcasts();

                setIsPlaying(false); // Reseta o player

                toast({
                    title: "Podcast Gerado com Sucesso!",
                    description: "Seu resumo de saúde personalizado está pronto para ouvir.",
                    className: "bg-green-500 text-white border-none"
                });
            } else {
                throw new Error(result.message || 'Erro ao gerar o podcast.');
            }
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Não foi possível gerar",
                description: error.message || "Tente novamente mais tarde.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingHintIndex((prev) => (prev + 1) % LOADING_HINTS.length);
            }, 3000);
        } else {
            setLoadingHintIndex(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading, LOADING_HINTS.length]);

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play error:", e));
        }
    };

    const changeSpeed = () => {
        const rates = [1, 1.25, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };


    const handlePlayHistory = (historyUrl: string, historyDate: string) => {
        setAudioUrl(historyUrl);
        setPodcastDate(historyDate);
        setIsPlaying(true);
        // Pequeno delay para garantir que o src mudou antes de dar play
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.play().catch(console.error);
            }
        }, 100);
    };

    if (isLoadingExisting) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
                <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
                        <p className="text-foreground/60">Buscando seu histórico...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen relative bg-gradient-to-br from-[#fce7f5] via-[#f9d5ed] to-[#fce7f5] text-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 dark:text-white overflow-hidden">
            {/* Futuristic background accents */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:50px_50px] opacity-0 dark:opacity-30"></div>
                <div className="dark:hidden">
                    <div className="absolute top-24 left-10 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse delay-500"></div>
                </div>
                <div className="hidden dark:block">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse delay-500"></div>
                </div>
            </div>
            <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl relative z-10">
                {/* Cabeçalho Visual */}
                <div className="flex flex-col items-center text-center space-y-6 mb-12">
                    <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/20 ring-1 ring-purple-500/15 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-500/30 dark:ring-cyan-500/20">
                        <Headphones className="h-12 w-12 text-purple-600 dark:text-cyan-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400">
                            Seu Podcast de Saúde
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-blue-200/80 max-w-2xl mx-auto">
                            Um episódio imersivo com orientações completas sobre sua jornada de saúde.
                        </p>
                    </div>

                    {/* Topics Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5">
                            <Headphones className="h-3 w-3" /> Educação Médica
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" /> Plano Semanal
                        </div>
                        <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1.5">
                            <Headphones className="h-3 w-3" /> Insights de IA
                        </div>
                    </div>

                    {/* Hosts Badges */}
                    <div className="flex items-center gap-3 bg-white/60 py-2 px-4 rounded-full border border-purple-200 backdrop-blur-sm dark:bg-slate-900/50 dark:border-cyan-500/20">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white/30 ring-1 ring-blue-200/40">D</div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white/30 ring-1 ring-pink-200/40">N</div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-blue-200/80">
                            Dr. Daniel <span className="text-slate-400 dark:text-white/40">&</span> Nathalia
                        </span>
                    </div>
                </div>

                <div className="grid gap-8">
                    {!audioUrl ? (
                        /* ESTADO: SEM PODCAST */
                        <Card className="bg-white/80 border-purple-200 backdrop-blur-xl shadow-2xl transition-all hover:shadow-purple-500/20 dark:bg-slate-900/60 dark:border-cyan-500/20 dark:hover:shadow-cyan-500/20">
                            <CardContent className="flex flex-col items-center justify-center py-16 space-y-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all dark:bg-cyan-500/20 dark:group-hover:bg-cyan-500/30"></div>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        size="lg"
                                        className="relative h-20 px-12 text-xl font-bold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/40 transition-all hover:scale-105 disabled:opacity-80 disabled:hover:scale-100"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>Gerando seu episódio...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="h-6 w-6 fill-white" />
                                                <span>Gerar Meu Podcast</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                                {isLoading && (
                                    <div className="w-full max-w-md mx-auto mt-2">
                                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                                            <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-pink-500 animate-[loadingstrip_1.2s_linear_infinite] rounded-full"></div>
                                        </div>
                                        <p className="mt-3 text-sm text-slate-600 text-center dark:text-blue-200/80">
                                            {LOADING_HINTS[loadingHintIndex]}
                                        </p>
                                        <p className="text-xs text-slate-500 text-center mt-1 dark:text-blue-200/50">
                                            Isso pode levar alguns minutos. Você será avisado quando terminar.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* ESTADO: COM PODCAST */
                        <Card className="bg-white/90 border-purple-200 backdrop-blur-xl overflow-hidden shadow-2xl relative dark:bg-slate-900/80 dark:border-cyan-500/20">
                            {/* Barra de progresso visual no topo */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse dark:from-cyan-500 dark:to-blue-600"></div>

                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                                            MediAI Daily
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full dark:bg-cyan-500/20 dark:text-cyan-300">EPISÓDIO NOVO</span>
                                        </h3>
                                        <p className="text-purple-700/80 text-sm dark:text-blue-200/80">
                                            Gerado em {podcastDate ? new Date(podcastDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : "Hoje"}
                                        </p>
                                    </div>

                                    {/* Botão de atualizar se houver novos exames */}
                                    {hasNewExams && (
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isLoading}
                                            size="sm"
                                            variant="outline"
                                            className="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-cyan-300 dark:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                            )}
                                            Gerar Novo Episódio
                                        </Button>
                                    )}
                                </div>


                                {/* Visualizador de Áudio e Progresso */}
                                <div className="bg-white/70 rounded-2xl border border-purple-200 p-6 shadow-inner dark:bg-slate-900/60 dark:border-cyan-500/20">
                                    {/* Visualizador de Barras */}
                                    <div className="h-24 flex items-center justify-center gap-1 mb-6 px-4">
                                        {Array.from({ length: 40 }).map((_, i) => {
                                            // Simulação de visualização baseada no progresso
                                            const progress = duration > 0 ? currentTime / duration : 0;
                                            const isActive = i / 40 <= progress;
                                            
                                            // Altura aleatória para simular onda, mas consistente
                                            const baseHeight = 20 + Math.random() * 40; 
                                            // Animação quando tocando
                                            const animationDelay = `${i * 0.05}s`;
                                            
                                            return (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 rounded-full transition-all duration-300 ${
                                                        isActive 
                                                            ? 'bg-gradient-to-t from-purple-600 to-pink-500 dark:from-cyan-500 dark:to-blue-500' 
                                                            : 'bg-slate-200 dark:bg-slate-700'
                                                    } ${isPlaying ? 'animate-music-bar' : ''}`}
                                                    style={{
                                                        height: isPlaying ? `${Math.max(20, Math.random() * 80)}%` : `${30 + Math.sin(i * 0.5) * 20}%`,
                                                        animationDelay: isPlaying ? `-${Math.random()}s` : '0s',
                                                        opacity: isActive ? 1 : 0.5
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Barra de Progresso Interativa */}
                                    <div className="flex flex-col gap-2">
                                        <div 
                                            className="w-full h-2 bg-slate-100 rounded-full dark:bg-slate-800 cursor-pointer relative group"
                                            onClick={(e) => {
                                                if (audioRef.current && duration) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const pos = (e.clientX - rect.left) / rect.width;
                                                    audioRef.current.currentTime = pos * duration;
                                                }
                                            }}
                                        >
                                            <div 
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-cyan-500 dark:to-blue-600 rounded-full transition-all duration-100"
                                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                            >
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-pink-500 dark:border-cyan-500 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controles do Player */}
                                <div className="flex items-center justify-center gap-8">
                                    <Button
                                        onClick={changeSpeed}
                                        variant="ghost"
                                        className="h-12 w-12 rounded-full border border-purple-100 text-purple-600 font-bold hover:bg-purple-50 dark:border-cyan-500/20 dark:text-cyan-400 dark:hover:bg-cyan-500/10"
                                    >
                                        {playbackRate}x
                                    </Button>

                                    <Button
                                        onClick={togglePlay}
                                        size="lg"
                                        className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:scale-105 transition-transform shadow-xl shadow-purple-500/30 dark:from-cyan-500 dark:to-blue-600 dark:shadow-cyan-500/30"
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-8 w-8 fill-current" />
                                        ) : (
                                            <Play className="h-8 w-8 fill-current ml-1" />
                                        )}
                                    </Button>

                                    <div className="w-12"></div> {/* Spacer for symmetry */}
                                </div>
                                <p className="text-xs text-center text-slate-500 uppercase tracking-widest font-bold dark:text-blue-200/50">
                                    {isPlaying ? "Tocando agora • Qualidade Alta" : "Clique para iniciar seu episódio"}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Alert className="bg-white/80 border-purple-200 backdrop-blur-sm dark:bg-slate-900/60 dark:border-cyan-500/20">
                        <AlertCircle className="h-4 w-4 text-purple-600 dark:text-cyan-300" />
                        <AlertTitle className="text-slate-900 font-bold dark:text-white">Isenção de Responsabilidade</AlertTitle>
                        <AlertDescription className="text-slate-700 text-sm mt-1 dark:text-blue-200/80 leading-relaxed">
                            Este podcast é gerado por IA com base em seus dados biométricos e plano de bem-estar. O conteúdo é puramente informativo e educacional. **Sempre consulte seu médico** antes de realizar qualquer alteração em seu tratamento ou dieta.
                        </AlertDescription>
                    </Alert>

                    {/* Histórico de Episódios */}
                    {podcastHistory.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                                    <Headphones className="h-5 w-5" />
                                </span>
                                Histórico de Episódios
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {podcastHistory.map((podcast) => (
                                    <Card key={podcast.id} className="bg-white/60 hover:bg-white/80 border-purple-100 transition-all cursor-pointer group dark:bg-slate-900/40 dark:border-cyan-500/10 dark:hover:bg-slate-900/60">
                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-cyan-400 transition-colors">
                                                    MediAI Daily
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-blue-200/60">
                                                    {new Date(podcast.generatedAt).toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handlePlayHistory(podcast.audioUrl, podcast.generatedAt)}
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full h-10 w-10 bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all dark:bg-cyan-500/10 dark:text-cyan-400 dark:group-hover:bg-cyan-500 dark:group-hover:text-white"
                                            >
                                                <Play className="h-5 w-5 fill-current" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Elemento de Áudio Oculto */}
                <audio
                    ref={audioRef}
                    src={audioUrl || ""}
                    crossOrigin="anonymous"
                    preload="auto"
                    className="hidden"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onError={(e) => console.error("Audio error:", e.currentTarget.error)}
                />
            </main>

            {/* Styles for equalizer animation */}
            <style jsx global>{`
                @keyframes equalizer {
                    0% { height: 20%; }
                    50% { height: 80%; }
                    100% { height: 20%; }
                }
                @keyframes loadingstrip {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                @keyframes music-bar {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1); }
                }
                .animate-music-bar {
                    animation: music-bar 1s ease-in-out infinite alternate;
                }
            `}</style>
        </div>
    );
}
