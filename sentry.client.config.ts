import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ajustar baseado no ambiente
  environment: process.env.NODE_ENV || 'development',
  
  // Sample rate para performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Desabilitar em desenvolvimento se não tiver DSN configurado
  enabled: process.env.NODE_ENV === 'production' || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configurações de privacidade
  beforeSend(event, hint) {
    // Remover informações sensíveis
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    // Filtrar headers sensíveis
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
      sensitiveHeaders.forEach(header => {
        if (event.request?.headers?.[header]) {
          delete event.request.headers[header];
        }
      });
    }
    
    return event;
  },
  
  // Ignorar erros comuns que não são críticos
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'NetworkError',
    'Failed to fetch',
  ],
});
