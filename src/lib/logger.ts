/**
 * Sistema de logs estruturados para MediAI
 * Fornece logging consistente com níveis, contexto e metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  role?: 'patient' | 'doctor' | 'admin';
  requestId?: string;
  sessionId?: string;
  ip?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string = 'mediai') {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      service: this.serviceName,
      environment: this.environment,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext, metadata?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);

    // Em desenvolvimento, usar console para melhor visualização
    if (this.environment === 'development') {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        fatal: '💀',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, context || '', metadata || '');
      if (error) {
        console.error(error);
      }
    } else {
      // Em produção, usar JSON estruturado
      console.log(formatted);
    }

    // Aqui pode adicionar integração com serviços externos
    // como Datadog, CloudWatch, Logtail, etc.
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log('debug', message, context, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log('info', message, context, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log('warn', message, context, metadata);
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.log('error', message, context, metadata, error);
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.log('fatal', message, context, metadata, error);
  }

  /**
   * Criar um logger filho com contexto pré-definido
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.parent.debug(message, this.mergeContext(context), metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.parent.info(message, this.mergeContext(context), metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.parent.warn(message, this.mergeContext(context), metadata);
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.parent.error(message, error, this.mergeContext(context), metadata);
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    this.parent.fatal(message, error, this.mergeContext(context), metadata);
  }
}

// Singleton instance
export const logger = new Logger('mediai');

// Convenience functions para uso direto
export const log = {
  debug: (msg: string, ctx?: LogContext, meta?: Record<string, any>) => logger.debug(msg, ctx, meta),
  info: (msg: string, ctx?: LogContext, meta?: Record<string, any>) => logger.info(msg, ctx, meta),
  warn: (msg: string, ctx?: LogContext, meta?: Record<string, any>) => logger.warn(msg, ctx, meta),
  error: (msg: string, err?: Error, ctx?: LogContext, meta?: Record<string, any>) => logger.error(msg, err, ctx, meta),
  fatal: (msg: string, err?: Error, ctx?: LogContext, meta?: Record<string, any>) => logger.fatal(msg, err, ctx, meta),
};
