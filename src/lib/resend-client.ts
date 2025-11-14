import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // Tentar usar variáveis de ambiente diretamente primeiro
  const envApiKey = process.env.RESEND_API_KEY;
  const envFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@appmediai.com';
  
  if (envApiKey) {
    console.log('✅ Usando RESEND_API_KEY das variáveis de ambiente');
    return { apiKey: envApiKey, fromEmail: envFromEmail };
  }

  // Fallback: tentar integração Replit
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Nem RESEND_API_KEY nem integração Replit configuradas. Adicione RESEND_API_KEY nas variáveis de ambiente.');
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (connectionSettings?.settings?.api_key) {
      console.log('✅ Usando integração Resend do Replit');
      return {
        apiKey: connectionSettings.settings.api_key, 
        fromEmail: connectionSettings.settings.from_email || envFromEmail
      };
    }
  } catch (error) {
    console.warn('⚠️ Erro ao tentar integração Replit:', error);
  }

  throw new Error('Resend não configurado. Adicione RESEND_API_KEY nas variáveis de ambiente do Replit (Secrets).');
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}
