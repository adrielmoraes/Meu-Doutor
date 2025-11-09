# Beyond Presence (BEY) Avatar - Guia de Configuração

## Visão Geral

O MediAI agora suporta **dois provedores de avatar** para consultas com IA em tempo real:
- **Tavus** - Avatar realista com tecnologia Phoenix-3 PRO
- **Beyond Presence (BEY)** - Avatar hiper-realista open source

## Configuração do Avatar Provider

### 1. Através do Painel Admin (Recomendado)

1. Faça login como admin: `/login`
2. Navegue para **Configurações**: `/admin/settings`
3. Localize o card **Avatar Provider**
4. Selecione entre:
   - **Tavus** - Requer TAVUS_API_KEY, TAVUS_REPLICA_ID, TAVUS_PERSONA_ID
   - **Beyond Presence (BEY)** - Requer BEY_API_KEY (BEY_AVATAR_ID opcional)
5. Clique em **Salvar Configurações**
6. Reinicie o workflow "MediAI Avatar Agent"

### 2. Credenciais Necessárias

#### Para Tavus (já configurado):
```bash
TAVUS_API_KEY=sua_api_key_tavus
TAVUS_REPLICA_ID=r3a47ce45e68
TAVUS_PERSONA_ID=p62f611e6898
```

#### Para Beyond Presence (BEY):
```bash
BEY_API_KEY=sua_api_key_bey
BEY_AVATAR_ID=b9be11b8-89fb-4227-8f86-4a881393cbdb  # Opcional, usa padrão se não especificado
```

**Obter API Key do BEY:**
1. Acesse: https://www.beyondpresence.ai/
2. Crie uma conta
3. Obtenha sua API key em: https://docs.bey.dev/api-key
4. Adicione como variável de ambiente `BEY_API_KEY` no Replit

## Como Funciona

### 1. Seleção de Avatar
- O painel admin armazena a preferência no banco de dados (`admin_settings.avatar_provider`)
- Valores: `'tavus'` ou `'bey'`
- Padrão: `'tavus'`

### 2. Inicialização do Agente
Quando um paciente inicia uma consulta:

```python
# O agente consulta o banco de dados
avatar_provider = get_avatar_provider_config()

# Inicializa o avatar correto
if avatar_provider == 'bey':
    # Beyond Presence
    avatar = bey.AvatarSession(avatar_id='...', ...)
else:
    # Tavus (padrão)
    avatar = tavus.AvatarSession(replica_id='...', ...)

# Inicia o avatar
await avatar.start(session, room=ctx.room)
```

### 3. Fallbacks Automáticos
- Se `BEY_API_KEY` estiver ausente → continua apenas com áudio
- Se `DATABASE_URL` estiver ausente → usa Tavus por padrão
- Se ocorrer erro no avatar → continua apenas com áudio

## Verificar Status

### No Console do Agente:
```
✅ Configuração LiveKit Agent:
  • Avatar Providers Disponíveis:
    - Tavus: 🎭 CONFIGURADO
      Replica ID: r3a47ce45e68
      Persona ID: p62f611e6898
    - Beyond Presence (BEY): ⚪ Não configurado
  • Avatar Ativo: Definido no Admin Panel (banco de dados)
```

### Nos Logs do Agente:
```json
{"message": "preloading plugins", "packages": [
  "livekit.plugins.tavus",
  "livekit.plugins.bey",
  "livekit.plugins.google"
]}
```

## Diferenças Entre Provedores

| Característica | Tavus | Beyond Presence (BEY) |
|----------------|-------|----------------------|
| **Qualidade** | Phoenix-3 PRO | Hiper-realista |
| **Latência** | Baixa | Alta performance |
| **Custo** | Créditos conversacionais | Baseado em uso |
| **Configuração** | API Key + Replica + Persona | API Key + Avatar ID (opcional) |
| **Open Source** | ❌ | ✅ |

## Troubleshooting

### Avatar não aparece
1. Verifique se as credenciais estão configuradas
2. Confirme a seleção no painel admin
3. Reinicie o workflow "MediAI Avatar Agent"
4. Verifique os logs do agente

### Erro 402 (Tavus)
- Adicione créditos conversacionais em: https://tavus.io/dashboard

### Erro 401 (BEY)
- Verifique se `BEY_API_KEY` está correta
- Confirme acesso à API em: https://docs.bey.dev/

## Instalação (Já Feita)

```bash
# Plugin Beyond Presence
pip install "livekit-agents[bey]~=1.0"

# Dependências de banco
pip install psycopg2-binary
```

## Arquivos Modificados

- `livekit-agent/agent.py` - Lógica de seleção de avatar
- `livekit-agent/run-agent.py` - Display de status
- `src/components/admin/settings/avatar-settings.tsx` - UI admin
- `src/app/admin/settings/actions.ts` - Server actions
- `shared/schema.ts` - Campo `avatarProvider` no banco
- `src/types/index.ts` - Tipo `AdminSettings` atualizado

## Referências

- **Beyond Presence Docs**: https://docs.bey.dev/
- **LiveKit BEY Plugin**: https://docs.livekit.io/agents/models/avatar/plugins/bey/
- **Tavus Docs**: https://docs.tavus.io/

---

**Desenvolvido para MediAI** - Plataforma de Saúde com IA 🏥✨
