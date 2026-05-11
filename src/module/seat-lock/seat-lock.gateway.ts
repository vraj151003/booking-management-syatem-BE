import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { BookingService } from '../booking/booking.service';
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'seats',
})
export class SeatLockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinShow')
  handleJoinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() showId: string,
  ) {
    client.join(`show:${showId}`);
    console.log(`Client ${client.id} joined show room: ${showId}`);
    return { event: 'joinedShow', data: showId };
  }

  @SubscribeMessage('leaveShow')
  handleLeaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() showId: string,
  ) {
    client.leave(`show:${showId}`);
    console.log(`Client ${client.id} left show room: ${showId}`);
    return { event: 'leftShow', data: showId };
  }

  @SubscribeMessage('lockSeat')
  async handleLockSeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; seatId: string; userId: string },
  ) {
    const { showId, seatId, userId } = data;
    const lockKey = `lock:${showId}:${seatId}`;

    try {
      // Use existing BookingService logic or direct Redis check
      const existingLock = await this.redisService.getLock(lockKey);
      if (existingLock) {
        client.emit('error', { message: 'Seat already locked' });
        return;
      }

      // Lock for 10 minutes (600 seconds)
      await this.redisService.setLock(lockKey, userId, 600);

      // Broadcast to everyone in the show room
      this.server.to(`show:${showId}`).emit('seatLocked', {
        showId,
        seatId,
        userId,
        expiresAt: Date.now() + 600 * 1000,
      });

      console.log(`Seat ${seatId} locked for show ${showId} by user ${userId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('unlockSeat')
  async handleUnlockSeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; seatId: string; userId: string },
  ) {
    const { showId, seatId, userId } = data;
    const lockKey = `lock:${showId}:${seatId}`;

    try {
      const existingLock = await this.redisService.getLock(lockKey);
      if (existingLock && existingLock === userId) {
        await this.redisService.deleteLock(lockKey);
        
        // Broadcast unlock
        this.server.to(`show:${showId}`).emit('seatUnlocked', {
          showId,
          seatId,
        });
        
        console.log(`Seat ${seatId} unlocked for show ${showId} by user ${userId}`);
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Method to be called from BookingService when a payment is confirmed
  notifySeatBooked(showId: string, seatIds: string[]) {
    this.server.to(`show:${showId}`).emit('seatsBooked', {
      showId,
      seatIds,
    });
    const seatList = seatIds ? seatIds.join(', ') : 'N/A';
    console.log(`Broadcasted permanent booking for seats ${seatList} in show ${showId}`);
  }
}
