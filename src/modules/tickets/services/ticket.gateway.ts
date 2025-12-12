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
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TicketGateway');

  afterInit(server: Server) {
    this.logger.log('TicketGateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewTicket(ticket: Ticket) {
    this.server.emit('newTicket', ticket);
    this.logger.log(`Broadcasting new ticket: ${ticket.id}`);
  }

  broadcastTicketUpdate(ticket: Ticket) {
    this.server.emit('ticketUpdated', ticket);
    this.logger.log(`Broadcasting update for ticket: ${ticket.id}`);
  }
}