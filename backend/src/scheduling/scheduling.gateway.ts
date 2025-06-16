import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/scheduling',
  cors: {
    origin: '*',
  },
})
export class SchedulingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe_to_area')
  handleSubscribeToArea(@MessageBody() data: { areaId: number }) {
    // Implementation for subscribing to area updates
  }

  emitEventUpdate(areaId: number, eventData: any) {
    this.server.emit('event_updated', { areaId, eventData });
  }

  emitEventCreated(areaId: number, eventData: any) {
    this.server.emit('event_created', { areaId, eventData });
  }

  emitEventDeleted(areaId: number, eventId: number) {
    this.server.emit('event_deleted', { areaId, eventId });
  }
}
