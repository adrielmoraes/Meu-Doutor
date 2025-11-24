import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPatientById, getExamsByPatientId, getConsultationsByPatient } from "@/lib/db-adapter";
import { ArrowLeft, User, Mail, Phone, MapPin, CalendarDays, FileText, MessageSquare, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import PatientQuotaManager from "@/components/admin/patient-quota-manager";
import { getSubscriptionByPatientId } from "@/lib/subscription-adapter";

// Force dynamic rendering to always fetch fresh data from database
// This prevents Next.js from caching the patient data, ensuring custom quotas are always up-to-date
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPatientDetailPage({ params }: { params: { id: string } }) {
  const [patient, exams, consultations, subscription] = await Promise.all([
    getPatientById(params.id),
    getExamsByPatientId(params.id),
    getConsultationsByPatient(params.id),
    getSubscriptionByPatientId(params.id)
  ]);

  if (!patient) {
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/admin/patients" className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {patient.name}
          </h1>
          <p className="text-gray-400 mt-2">Detalhes completos do paciente</p>
        </div>
        <Badge
          variant={patient.status === 'Validado' ? 'secondary' : 'default'}
          className={patient.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
        >
          {patient.status}
        </Badge>
      </div>

      {/* Patient Info Card */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Informações do Paciente</CardTitle>
          <CardDescription>Dados cadastrais e informações de contato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Mail className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{patient.email}</p>
              </div>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <Phone className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-sm text-white">{patient.phone}</p>
                </div>
              </div>
            )}
            {(patient.city || patient.state) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Localização</p>
                  <p className="text-sm text-white">{[patient.city, patient.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <CalendarDays className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-xs text-gray-500">Idade</p>
                <p className="text-sm text-white">{patient.age} anos</p>
              </div>
            </div>
          </div>
          
          {patient.medicalHistory && (
            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400 font-semibold mb-2">Histórico Médico</p>
              <p className="text-sm text-gray-300">{patient.medicalHistory}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exames
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{exams.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{consultations.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">{patient.status}</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Quota Manager */}
      <PatientQuotaManager 
        patientId={patient.id}
        customQuotas={patient.customQuotas}
        currentPlan={subscription?.planId || 'trial'}
      />

      {/* Exams List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Exames</CardTitle>
          <CardDescription>Todos os exames enviados pelo paciente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exams.length > 0 ? (
              exams.map((exam: any) => (
                <div key={exam.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-green-400" />
                        <h4 className="font-semibold text-white">{exam.type}</h4>
                        <Badge
                          variant={exam.status === 'Validado' ? 'secondary' : 'default'}
                          className={exam.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                        >
                          {exam.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {new Date(exam.date).toLocaleDateString('pt-BR')}
                      </p>
                      {exam.preliminaryDiagnosis && (
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-400 mb-1">Diagnóstico Preliminar (IA):</p>
                          <p className="text-sm text-gray-300">{exam.preliminaryDiagnosis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum exame enviado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Consultas</CardTitle>
          <CardDescription>Todas as consultas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consultations.length > 0 ? (
              consultations.map((consultation: any) => (
                <div key={consultation.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    <Badge variant="outline" className={
                      consultation.type === 'video-call' 
                        ? 'border-purple-500/50 text-purple-400' 
                        : 'border-cyan-500/50 text-cyan-400'
                    }>
                      {consultation.type === 'video-call' ? 'Vídeo' : 'Chat'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(consultation.date).toLocaleDateString('pt-BR')}
                  </p>
                  {consultation.summary && (
                    <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                      <p className="text-xs text-orange-400 mb-1">Resumo:</p>
                      <p className="text-sm text-gray-300">{consultation.summary}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma consulta realizada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
