# Avatar Realista - Guia de Implementação Completa

## Status Atual

O sistema MediAI possui a infraestrutura completa para um avatar realista falante, mas a renderização visual do avatar ainda precisa ser implementada. Atualmente:

✅ **Implementado:**
- Componente `RealisticAvatar` com estrutura para 3D e D-ID
- Integração com sistema de TTS (Text-to-Speech) via Gemini
- Controles de UI (play/pause, mute, troca de gênero/tipo)
- Estados visuais (listening, speaking)
- Gerenciamento de áudio com sincronização

❌ **Pendente:**
- Renderização 3D real com Three.js + TalkingHead.js
- Integração com D-ID Streaming API
- Sincronização labial (lip-sync) real com áudio

---

## Opções de Implementação

### Opção 1: TalkingHead.js (Open Source - GRATUITO) ⭐ Recomendado

**Vantagens:**
- 100% gratuito e open-source (MIT License)
- Funciona direto no navegador (WebGL)
- Suporta Ready Player Me avatars
- Lip-sync em tempo real
- Sem custos recorrentes

**Desvantagens:**
- Requer configuração de Three.js
- Qualidade menor que soluções comerciais
- Necessita de modelos 3D (Ready Player Me)

#### Passos para Implementar:

1. **Instalar dependências:**
```bash
npm install three @types/three
```

2. **Baixar TalkingHead.js:**
```bash
# Adicionar ao package.json:
# "talkinghead": "github:met4citizen/TalkingHead"
npm install
```

3. **Atualizar componente RealisticAvatar:**

```typescript
// src/components/patient/realistic-avatar.tsx
import * as THREE from 'three';

const initialize3DAvatar = async () => {
  try {
    setIsLoading(true);
    
    // Importar TalkingHead dinamicamente
    const { TalkingHead } = await import('talkinghead');
    
    const head = new TalkingHead(avatarContainerRef.current!, {
      ttsEndpoint: null, // Vamos usar nosso próprio TTS do Gemini
      cameraView: 'upper',
      cameraDistance: 1.2,
      avatarMood: 'neutral'
    });

    await head.showAvatar({
      url: gender === 'female'
        ? 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb'
        : 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a7.glb',
      body: 'F',
      avatarMood: 'neutral',
      lipsyncLang: 'pt'
    });

    talkingHeadRef.current = head;
    setIsLoading(false);
  } catch (err) {
    console.error('[Avatar] Erro:', err);
    setError('Falha ao carregar avatar 3D.');
  }
};

const playAudioWithLipSync = async (base64Audio: string) => {
  try {
    if (!talkingHeadRef.current) return;

    const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // TalkingHead faz lip-sync automaticamente com o áudio
    await talkingHeadRef.current.speakAudio(audioUrl);
    
  } catch (err) {
    console.error('[Avatar] Erro ao reproduzir:', err);
  }
};
```

4. **Criar avatares no Ready Player Me:**
- Acesse: https://readyplayer.me/
- Crie 2 avatares (masculino e feminino)
- Baixe os URLs dos modelos .glb
- Substitua nos URLs do código acima

---

### Opção 2: D-ID Streaming API (Comercial - $5.90/mês)

**Vantagens:**
- Qualidade fotorrealista
- API simples de integrar
- Streaming em tempo real (100 FPS)
- Suporta foto estática como base

**Desvantagens:**
- Requer assinatura paga
- Custos por minuto de vídeo gerado
- Necessita de chave de API D-ID

#### Passos para Implementar:

1. **Criar conta D-ID:**
- Acesse: https://studio.d-id.com/
- Crie conta e obtenha API key
- Adicione `D_ID_API_KEY` nas variáveis de ambiente

2. **Instalar pacote:**
```bash
npm install d-id-client
```

3. **Criar API route para D-ID:**

```typescript
// src/app/api/avatar/d-id-stream/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { text, gender } = await request.json();
  
  const response = await fetch('https://api.d-id.com/talks/streams', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.D_ID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source_url: gender === 'female' 
        ? 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'
        : 'https://create-images-results.d-id.com/DefaultPresenters/Dylan_m/image.jpeg',
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: gender === 'female' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural'
        }
      }
    })
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

4. **Atualizar componente RealisticAvatar:**

```typescript
const initializeDIDAvatar = async () => {
  try {
    setIsLoading(true);
    
    // Criar sessão de stream D-ID
    const response = await fetch('/api/avatar/d-id-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: 'Olá! Eu sou a MediAI, sua assistente médica virtual.',
        gender 
      })
    });

    const { stream_url, session_id } = await response.json();
    
    // Exibir vídeo stream
    if (avatarContainerRef.current) {
      avatarContainerRef.current.innerHTML = `
        <video 
          autoplay 
          playsinline 
          src="${stream_url}" 
          class="w-full h-full object-cover rounded-lg"
        />
      `;
    }

    setIsLoading(false);
  } catch (err) {
    console.error('[Avatar] Erro D-ID:', err);
    setError('Falha ao conectar com D-ID.');
  }
};
```

---

### Opção 3: MuseTalk (Open Source - Alta Qualidade)

**Vantagens:**
- Qualidade superior a TalkingHead
- Gratuito (MIT License)
- Melhor lip-sync

**Desvantagens:**
- Requer GPU potente
- Precisa ser hospedado em servidor separado
- Mais complexo de configurar

#### Implementação:
- Requer backend Python separado
- Fora do escopo desta documentação
- Consultar: https://github.com/TMElyralab/MuseTalk

---

## Integração com Sistema Existente

Após implementar uma das opções acima, o avatar estará integrado com:

1. ✅ **Sistema de TTS**: Gemini gera áudio, avatar sincroniza labial
2. ✅ **Consulta em Tempo Real**: `live-consultation-flow` alimenta avatar
3. ✅ **Histórico de Consultas**: IA usa contexto para respostas personalizadas
4. ✅ **Lista de Médicos**: IA recomenda médicos do sistema
5. ✅ **Controles de UI**: Paciente controla gênero, tipo, mute, etc.

---

## Próximos Passos Recomendados

1. **Implementar TalkingHead.js** (Opção 1)
   - Sem custos
   - Mais rápido de implementar
   - Boa experiência de usuário

2. **Testar com usuários reais**
   - Coletar feedback sobre qualidade do avatar
   - Ajustar expressões e movimentos

3. **Otimizar performance**
   - Lazy loading do Three.js
   - Preload de modelos 3D
   - Caching de avatares

4. **Considerar upgrade para D-ID**
   - Se usuários demandarem qualidade fotorrealista
   - Após validar produto com TalkingHead

---

## Suporte e Recursos

- **TalkingHead.js**: https://github.com/met4citizen/TalkingHead
- **Ready Player Me**: https://readyplayer.me/
- **D-ID API Docs**: https://docs.d-id.com/
- **Three.js Docs**: https://threejs.org/docs/

---

## Variáveis de Ambiente Necessárias

```bash
# Opcional - para D-ID
D_ID_API_KEY=your_d_id_api_key_here

# Já configuradas
GEMINI_API_KEY=your_gemini_key
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_key
```

---

**Data de Criação:** Outubro 3, 2025  
**Autor:** MediAI Development Team
