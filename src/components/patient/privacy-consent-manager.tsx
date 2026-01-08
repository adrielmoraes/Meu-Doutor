"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Share2, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { recordConsent, hasActiveConsent } from "@/lib/security-audit";
import { Badge } from "@/components/ui/badge";

interface PrivacyConsentManagerProps {
    patientId: string;
    patientEmail: string;
}

export default function PrivacyConsentManager({ patientId, patientEmail }: PrivacyConsentManagerProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [consents, setConsents] = useState<{
        marketing: boolean;
        dataSharing: boolean;
        thirdParty: boolean;
    }>({
        marketing: false,
        dataSharing: false,
        thirdParty: false,
    });

    useEffect(() => {
        loadConsents();
    }, [patientId]);

    const loadConsents = async () => {
        try {
            const [marketing, dataSharing, thirdParty] = await Promise.all([
                hasActiveConsent(patientId, 'marketing'),
                hasActiveConsent(patientId, 'health_data_sharing'),
                hasActiveConsent(patientId, 'third_party_sharing'),
            ]);
            setConsents({ marketing, dataSharing, thirdParty });
        } catch (error) {
            console.error("Failed to load consents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (type: 'marketing' | 'dataSharing' | 'thirdParty', value: boolean) => {
        // Optimistic update
        setConsents(prev => ({ ...prev, [type]: value }));
        const consentTypeMap = {
            marketing: 'marketing',
            dataSharing: 'health_data_sharing',
            thirdParty: 'third_party_sharing',
        } as const;

        try {
            await recordConsent({
                userId: patientId,
                userType: 'patient',
                userEmail: patientEmail,
                consentType: consentTypeMap[type] as any,
                consentVersion: '1.0',
                granted: value,
            });
            toast({
                title: value ? "Consentimento Concedido" : "Consentimento Revogado",
                description: "Suas preferências de privacidade foram atualizadas.",
                className: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
            });
        } catch (error) {
            console.error("Failed to update consent:", error);
            // Revert optimization
            setConsents(prev => ({ ...prev, [type]: !value }));
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível salvar sua preferência. Tente novamente.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Termos de Uso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Aceito em cadastro</span>
                            <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">Ativo</Badge>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-xs mt-2 text-green-600">Ler Documento</Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Política de Privacidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Aceito em cadastro</span>
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">Ativo</Badge>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-xs mt-2 text-blue-600">Ler Documento</Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="h-5 w-5 text-purple-600" />
                            Segurança da Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Último acesso seguro</span>
                            <span className="text-xs font-mono text-purple-700">Hoje</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-xs mt-2 text-purple-600">Ver Atividade</Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-cyan-500/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-6 w-6 text-cyan-500" />
                        Gerenciar Consentimentos (LGPD)
                    </CardTitle>
                    <CardDescription>
                        Controle como seus dados são usados e compartilhados. Você pode alterar essas configurações a qualquer momento.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="flex items-center justify-between space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="data-sharing" className="text-base font-semibold">
                                    Compartilhamento para Pesquisa Clínica
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Permitir que dados anonimizados sejam usados para melhorar os algoritmos de IA e pesquisas médicas.
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="data-sharing"
                            checked={consents.dataSharing}
                            onCheckedChange={(checked) => handleToggle('dataSharing', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                <Share2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="third-party" className="text-base font-semibold">
                                    Integração com Parceiros
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Permitir compartilhamento de dados com laboratórios e farmácias parceiras para descontos e agilidade.
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="third-party"
                            checked={consents.thirdParty}
                            onCheckedChange={(checked) => handleToggle('thirdParty', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="marketing" className="text-base font-semibold">
                                    Comunicações de Marketing
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receber e-mails e notificações sobre novos recursos, promoções e conteúdos educativos.
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="marketing"
                            checked={consents.marketing}
                            onCheckedChange={(checked) => handleToggle('marketing', checked)}
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-semibold mb-1">Seus Direitos (LGPD)</p>
                            <p>Você tem direito de solicitar a exclusão dos seus dados, portabilidade ou correção a qualquer momento. Entre em contato com nosso DPO (Data Protection Officer) em dpo@mediai.com.</p>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
