import * as Sentry from '@sentry/nextjs';

/**
 * Helper para capturar exceções com contexto adicional
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: {
      id: string;
      role?: 'patient' | 'doctor' | 'admin';
      email?: string;
    };
  }
) {
  Sentry.withScope((scope) => {
    // Adicionar tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Adicionar dados extras
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Adicionar informações do usuário (sem dados sensíveis)
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        role: context.user.role,
        // Não incluir email em produção por privacidade
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Helper para capturar mensagens customizadas
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Helper para criar breadcrumbs de rastreamento
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wrapper para funções async que captura erros automaticamente
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: {
    name: string;
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      addBreadcrumb(
        `Executando: ${context?.name || fn.name}`,
        'function-call',
        { args: args.length }
      );
      
      return await fn(...args);
    } catch (error) {
      captureException(error, {
        tags: {
          function: context?.name || fn.name,
          ...context?.tags,
        },
        extra: {
          arguments: args,
        },
      });
      throw error;
    }
  }) as T;
}
