/**
 * Sistema de Notificações em Tempo Real usando Server-Sent Events (SSE)
 * Para notificações de novos exames, consultas, mensagens, etc.
 */

export type NotificationType = 'exam_ready' | 'consultation_scheduled' | 'message' | 'alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

class NotificationManager {
  private connections: Map<string, Set<WritableStreamDefaultWriter>> = new Map();

  /**
   * Registra uma conexão SSE para um usuário
   */
  registerConnection(userId: string, writer: WritableStreamDefaultWriter) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(writer);
  }

  /**
   * Remove uma conexão SSE
   */
  removeConnection(userId: string, writer: WritableStreamDefaultWriter) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(writer);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Envia notificação para um usuário específico
   */
  async sendToUser(userId: string, notification: Notification) {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      return;
    }

    const data = `data: ${JSON.stringify(notification)}\n\n`;
    const encoder = new TextEncoder();
    const payload = encoder.encode(data);

    const deadConnections: WritableStreamDefaultWriter[] = [];

    for (const writer of userConnections) {
      try {
        await writer.write(payload);
      } catch (error) {
        deadConnections.push(writer);
      }
    }

    // Remover conexões mortas
    deadConnections.forEach(writer => {
      this.removeConnection(userId, writer);
    });
  }

  /**
   * Envia notificação para todos os usuários conectados
   */
  async broadcast(notification: Notification) {
    for (const userId of this.connections.keys()) {
      await this.sendToUser(userId, notification);
    }
  }

  /**
   * Retorna o número de conexões ativas
   */
  getActiveConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }
}

export const notificationManager = new NotificationManager();

/**
 * Helper para criar stream SSE
 */
export function createSSEStream(userId: string) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  notificationManager.registerConnection(userId, writer);
  
  // Enviar keep-alive a cada 30 segundos
  const keepAlive = setInterval(async () => {
    try {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(': keep-alive\n\n'));
    } catch (error) {
      clearInterval(keepAlive);
      notificationManager.removeConnection(userId, writer);
    }
  }, 30000);

  return stream.readable;
}
