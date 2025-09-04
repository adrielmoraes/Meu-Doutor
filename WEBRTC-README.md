# Implementação de Chamadas de Vídeo/Voz em Tempo Real

## Visão Geral
Esta implementação adiciona funcionalidades de chamada de vídeo e voz em tempo real entre pacientes e médicos usando WebRTC e Firebase.

## Componentes Implementados

### 1. Componente de Vídeo WebRTC (`src/components/video-call/VideoCall.tsx`)
- Interface reutilizável para chamadas de vídeo
- Controles de áudio e vídeo (mute/unmute)
- Indicadores de status da conexão
- Botão de encerrar chamada

### 2. Páginas de Chamada

#### Para Pacientes (`src/app/patient/call/[doctorId]/page.tsx`)
- Permite iniciar chamada com um médico específico
- Interface simples com botão "Iniciar Chamada"

#### Para Médicos (`src/app/doctor/calls/page.tsx`)
- Lista todas as chamadas pendentes
- Permite atender chamadas de pacientes
- Interface de gerenciamento de chamadas

### 3. APIs de Sinalização

#### Criar Chamada (`POST /api/webrtc/create-call`)
```json
{
  "roomId": "call_123456789",
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "type": "patient-initiated"
}
```

#### Enviar Sinal (`POST /api/webrtc/signal`)
```json
{
  "roomId": "call_123456789",
  "from": "user-id",
  "to": "target-user-id",
  "signal": { ... }
}
```

#### Escutar Sinais (`GET /api/webrtc/listen/[roomId]/[userId]`)
- Server-Sent Events para receber sinais em tempo real

#### Buscar Chamadas do Médico (`GET /api/webrtc/doctor-calls/[doctorId]`)
- Retorna lista de chamadas pendentes

#### Atualizar Status (`POST /api/webrtc/update-call-status`)
```json
{
  "roomId": "call_123456789",
  "status": "active|ended"
}
```

## Como Usar

### Para Pacientes
1. Acesse `/patient/call/[doctorId]` para iniciar uma chamada
2. Clique em "Iniciar Chamada"
3. Aguarde o médico atender

### Para Médicos
1. Acesse `/doctor/calls` para ver chamadas pendentes
2. Clique em "Atender Chamada" para aceitar uma chamada
3. Use os controles de áudio/vídeo durante a chamada

## Configuração do Firebase

### Coleções Necessárias
1. `callRooms` - Armazena informações das chamadas
2. `callRooms/{roomId}/signals` - Armazena sinais WebRTC

### Estrutura dos Documentos

#### callRooms
```javascript
{
  patientId: "string",
  doctorId: "string",
  type: "patient-initiated|doctor-initiated",
  status: "waiting|active|ended",
  createdAt: "ISO string",
  startedAt: "ISO string|null",
  endedAt: "ISO string|null"
}
```

#### signals
```javascript
{
  from: "user-id",
  to: "user-id",
  type: "offer|answer|ice-candidate",
  data: { ... },
  timestamp: "ISO string"
}
```

## Segurança
- Todas as APIs verificam autenticação
- Sinais são roteados apenas para usuários autorizados
- Dados de chamada são armazenados com timestamps

## Próximos Passos
1. Adicionar gravação de chamadas
2. Implementar chat de texto durante chamadas
3. Adicionar compartilhamento de tela
4. Implementar notificações push para chamadas
5. Adicionar histórico de chamadas

## Dependências
- `simple-peer`: Biblioteca WebRTC simplificada
- `@types/simple-peer`: Tipos TypeScript para simple-peer