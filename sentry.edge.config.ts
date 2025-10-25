import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Ajustar baseado no ambiente
  environment: process.env.NODE_ENV || 'development',
  
  // Sample rate para performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Desabilitar em desenvolvimento se não tiver DSN configurado
  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
});
