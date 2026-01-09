import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Ticket } from '../entities/ticket.entity';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // En un entorno de producción, deberías restringir esto a dominios específicos
  },
  namespace: 'tickets', // Namespace para organizar los eventos de tickets
})
export class TicketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TicketGateway');

  afterInit(server: Server) {
    this.logger.log('TicketGateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const companyId = client.handshake.query.companyId;
    if (companyId) {
      const room = `company_${companyId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room: ${room}`);
    } else {
      this.logger.warn(`Client ${client.id} connected without companyId`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewTicket(ticket: Ticket) {
    const companyId = ticket.companyId || (ticket.company && ticket.company.id);
    if (companyId) {
      this.server.to(`company_${companyId}`).emit('newTicket', ticket);
      this.logger.log(
        `Broadcasting new ticket: ${ticket.id} to company_${companyId}`,
      );
    }
  }

  broadcastTicketUpdate(ticket: Ticket) {
    const companyId = ticket.companyId || (ticket.company && ticket.company.id);
    if (companyId) {
      this.server.to(`company_${companyId}`).emit('ticketUpdated', ticket);
      this.logger.log(
        `Broadcasting update for ticket: ${ticket.id} to company_${companyId}`,
      );
    }
  }

  broadcastLowStockAlert(payload: any) {
    if (payload.companyId) {
      this.server
        .to(`company_${payload.companyId}`)
        .emit('lowStockAlert', payload);
      this.logger.warn(
        `Low stock alert emitted for ${payload.type}: ${payload.name} to company_${payload.companyId}`,
      );
    }
  }
}
