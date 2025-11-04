
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getTavusConversationsByPatient } from '@/lib/db-adapter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock, TrendingUp, Calendar } from 'lucide-react';

export default async function TavusHistoryPage() {
    const session = await getSession();

    if (!session || session.role !== 'patient') {
        redirect('/login');
    }

    const conversations = await getTavusConversationsByPatient(session.userId);

    const averageQuality = conversations.length > 0 
        ? (conversations.reduce((acc, c) => acc + (c.qualityScore || 0), 0) / conversations.length).toFixed(1)
        : '-';

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-primary/60 dark:text-primary" />
                <div>
                    <h1 className="text-3xl font-bold text-foreground/60 dark:text-foreground">
                        Histórico de Consultas Virtuais
                    </h1>
                    <p className="text-foreground/70 dark:text-muted-foreground">
                        Todas as suas conversas com a assistente virtual MediAI
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-primary/60 dark:text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground/70 dark:text-muted-foreground">Total de Consultas</p>
                            <p className="text-2xl font-bold text-foreground/60 dark:text-foreground">{conversations.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <Clock className="h-6 w-6 text-accent/60 dark:text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground/70 dark:text-muted-foreground">Tempo Total</p>
                            <p className="text-2xl font-bold text-foreground/60 dark:text-foreground">
                                {Math.round(conversations.reduce((acc, c) => acc + (c.duration || 0), 0) / 60)} min
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground/70 dark:text-muted-foreground">Qualidade Média</p>
                            <p className="text-2xl font-bold text-foreground/60 dark:text-foreground">
                                {averageQuality}/10
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                {conversations.length === 0 ? (
                    <Card className="p-8 text-center">
                        <MessageSquare className="h-16 w-16 text-foreground/70 dark:text-muted-foreground mx-auto mb-4" />
                        <p className="text-foreground/70 dark:text-muted-foreground">Nenhuma consulta virtual realizada ainda.</p>
                    </Card>
                ) : (
                    conversations.map((conv) => (
                        <Card key={conv.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-foreground/70 dark:text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold text-foreground/60 dark:text-foreground">
                                            {new Date(conv.startTime).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-foreground/70 dark:text-muted-foreground">
                                            {new Date(conv.startTime).toLocaleTimeString('pt-BR')}
                                            {conv.duration && ` • ${Math.round(conv.duration / 60)} minutos`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {conv.qualityScore && (
                                        <Badge variant="secondary">
                                            Qualidade: {conv.qualityScore}/10
                                        </Badge>
                                    )}
                                    <Badge variant="outline">Concluída</Badge>
                                </div>
                            </div>

                            {conv.summary && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-foreground/60 dark:text-foreground mb-2">Resumo da Consulta</h3>
                                    <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{conv.summary}</p>
                                </div>
                            )}

                            {conv.mainConcerns && conv.mainConcerns.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-foreground/60 dark:text-foreground mb-2">Principais Preocupações</h3>
                                    <ul className="list-disc list-inside text-sm text-card-foreground space-y-1">
                                        {conv.mainConcerns.map((concern: string, idx: number) => (
                                            <li key={idx}>{concern}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {conv.aiRecommendations && conv.aiRecommendations.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-foreground/60 dark:text-foreground mb-2">Recomendações</h3>
                                    <ul className="list-disc list-inside text-sm text-card-foreground space-y-1">
                                        {conv.aiRecommendations.map((rec: string, idx: number) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {conv.transcript && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm text-primary/60 dark:text-primary hover:text-primary/40 dark:hover:text-primary/80 font-medium">
                                        Ver transcrição completa
                                    </summary>
                                    <ScrollArea className="mt-3 h-64 rounded-lg border p-4 bg-muted/50">
                                        <pre className="text-xs whitespace-pre-wrap text-card-foreground">
                                            {conv.transcript}
                                        </pre>
                                    </ScrollArea>
                                </details>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
