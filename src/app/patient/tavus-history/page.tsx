
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getTavusConversationsByPatient } from '@/lib/firestore-admin-adapter';
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-teal-600" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Histórico de Consultas Virtuais
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Todas as suas conversas com a assistente virtual MediAI
                    </p>
                </div>
            </div>

            {/* Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Consultas</p>
                            <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tempo Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Math.round(conversations.reduce((acc, c) => acc + (c.duration || 0), 0) / 60)} min
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Qualidade Média</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {conversations.length > 0 ? '8.5/10' : '-'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Lista de Consultas */}
            <div className="space-y-4">
                {conversations.length === 0 ? (
                    <Card className="p-8 text-center">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhuma consulta virtual realizada ainda.</p>
                    </Card>
                ) : (
                    conversations.map((conv) => (
                        <Card key={conv.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(conv.startTime).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(conv.startTime).toLocaleTimeString('pt-BR')}
                                            {conv.duration && ` • ${Math.round(conv.duration / 60)} minutos`}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline">Concluída</Badge>
                            </div>

                            {conv.summary && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Resumo da Consulta</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{conv.summary}</p>
                                </div>
                            )}

                            {conv.transcript && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm text-teal-600 hover:text-teal-700 font-medium">
                                        Ver transcrição completa
                                    </summary>
                                    <ScrollArea className="mt-3 h-64 rounded-lg border p-4 bg-gray-50">
                                        <pre className="text-xs whitespace-pre-wrap text-gray-700">
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
