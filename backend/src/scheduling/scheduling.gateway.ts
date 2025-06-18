import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ScheduleEventDto } from './dto';

@WebSocketGateway({
  namespace: '/scheduling',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
})
export class SchedulingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SchedulingGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  /**
   * Maneja nuevas conexiones WebSocket
   */
  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Enviar mensaje de bienvenida
    client.emit('connection_established', {
      message: 'Conectado al sistema de programación académica',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Maneja desconexiones WebSocket
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Permite a los clientes suscribirse a actualizaciones de un área específica
   */
  @SubscribeMessage('join_area')
  handleJoinArea(
    @MessageBody() data: { areaId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `area_${data.areaId}`;
    
    try {
      client.join(roomName);
      this.logger.log(`Cliente ${client.id} se unió al área ${data.areaId}`);
      
      client.emit('joined_area', {
        areaId: data.areaId,
        message: `Te has suscrito a las actualizaciones del área ${data.areaId}`,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, areaId: data.areaId };
    } catch (error) {
      this.logger.error(`Error al unir cliente al área: ${error.message}`);
      client.emit('error', {
        message: 'Error al suscribirse al área',
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Permite a los clientes salir de un área específica
   */
  @SubscribeMessage('leave_area')
  handleLeaveArea(
    @MessageBody() data: { areaId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `area_${data.areaId}`;
    
    try {
      client.leave(roomName);
      this.logger.log(`Cliente ${client.id} salió del área ${data.areaId}`);
      
      client.emit('left_area', {
        areaId: data.areaId,
        message: `Te has desuscrito de las actualizaciones del área ${data.areaId}`,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, areaId: data.areaId };
    } catch (error) {
      this.logger.error(`Error al salir del área: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Maneja solicitudes de ping para verificar conexión
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      clientId: client.id,
    });
    return { success: true };
  }

  /**
   * Emite un evento cuando se crea un nuevo evento de programación
   */
  emitEventCreated(areaId: number, eventData: ScheduleEventDto) {
    const roomName = `area_${areaId}`;
    
    this.logger.log(`Emitiendo evento creado para área ${areaId}`);
    
    this.server.to(roomName).emit('event_created', {
      type: 'event_created',
      areaId,
      eventData,
      timestamp: new Date().toISOString(),
    });

    // También emitir a todos los clientes conectados (opcional)
    this.server.emit('global_event_created', {
      type: 'global_event_created',
      areaId,
      eventData: {
        id: eventData.id,
        subject_name: eventData.subject_name,
        teacher_name: eventData.teacher_name,
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite un evento cuando se actualiza un evento de programación
   */
  emitEventUpdated(areaId: number, eventData: ScheduleEventDto) {
    const roomName = `area_${areaId}`;
    
    this.logger.log(`Emitiendo evento actualizado para área ${areaId}`);
    
    this.server.to(roomName).emit('event_updated', {
      type: 'event_updated',
      areaId,
      eventData,
      timestamp: new Date().toISOString(),
    });

    // También emitir a todos los clientes conectados (opcional)
    this.server.emit('global_event_updated', {
      type: 'global_event_updated',
      areaId,
      eventData: {
        id: eventData.id,
        subject_name: eventData.subject_name,
        teacher_name: eventData.teacher_name,
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite un evento cuando se elimina un evento de programación
   */
  emitEventDeleted(areaId: number, eventId: number) {
    const roomName = `area_${areaId}`;
    
    this.logger.log(`Emitiendo evento eliminado para área ${areaId}, evento ${eventId}`);
    
    this.server.to(roomName).emit('event_deleted', {
      type: 'event_deleted',
      areaId,
      eventId,
      timestamp: new Date().toISOString(),
    });

    // También emitir a todos los clientes conectados (opcional)
    this.server.emit('global_event_deleted', {
      type: 'global_event_deleted',
      areaId,
      eventId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite notificación de conflicto de programación
   */
  emitScheduleConflict(areaId: number, conflictData: any) {
    const roomName = `area_${areaId}`;
    
    this.logger.warn(`Emitiendo conflicto de programación para área ${areaId}`);
    
    this.server.to(roomName).emit('schedule_conflict', {
      type: 'schedule_conflict',
      areaId,
      conflictData,
      severity: 'warning',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite estadísticas en tiempo real del área
   */
  emitAreaStatistics(areaId: number, statistics: any) {
    const roomName = `area_${areaId}`;
    
    this.server.to(roomName).emit('area_statistics', {
      type: 'area_statistics',
      areaId,
      statistics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtiene información sobre las conexiones activas
   */
  getConnectionInfo() {
    return {
      totalConnections: this.connectedClients.size,
      connectedClients: Array.from(this.connectedClients.keys()),
    };
  }
}
