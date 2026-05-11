import { Test, TestingModule } from '@nestjs/testing';
import { SeatLockGateway } from './seat-lock.gateway';
import { RedisService } from '../redis/redis.service';
import { BookingService } from '../booking/booking.service';
import { Server, Socket } from 'socket.io';

describe('SeatLockGateway', () => {
  let gateway: SeatLockGateway;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockBookingService: jest.Mocked<BookingService>;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockRedisService = {
      getLock: jest.fn(),
      setLock: jest.fn(),
      deleteLock: jest.fn(),
    } as any;

    mockBookingService = {} as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockClient = {
      id: 'test-client-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatLockGateway,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    gateway = module.get<SeatLockGateway>(SeatLockGateway);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Gateway Initialization', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should have server property initialized', () => {
      expect(gateway.server).toBeDefined();
    });
  });

  describe('Connection Handling', () => {
    describe('handleConnection', () => {
      it('should log client connection', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        gateway.handleConnection(mockClient);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client connected: ${mockClient.id}`);
        consoleSpy.mockRestore();
      });

      it('should handle connection with different client IDs', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const differentClient = { ...mockClient, id: 'different-client-id' } as any;
        
        gateway.handleConnection(differentClient);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client connected: different-client-id`);
        consoleSpy.mockRestore();
      });
    });

    describe('handleDisconnect', () => {
      it('should log client disconnection', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        gateway.handleDisconnect(mockClient);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: ${mockClient.id}`);
        consoleSpy.mockRestore();
      });

      it('should handle disconnection with different client IDs', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const differentClient = { ...mockClient, id: 'another-client-id' } as any;
        
        gateway.handleDisconnect(differentClient);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: another-client-id`);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Room Management', () => {
    describe('handleJoinShow', () => {
      it('should join client to show room and return success response', () => {
        const showId = 'show-123';
        
        const result = gateway.handleJoinShow(mockClient, showId);
        
        expect(mockClient.join).toHaveBeenCalledWith(`show:${showId}`);
        expect(result).toEqual({ event: 'joinedShow', data: showId });
      });

      it('should log room join action', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const showId = 'show-456';
        
        gateway.handleJoinShow(mockClient, showId);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client ${mockClient.id} joined show room: ${showId}`);
        consoleSpy.mockRestore();
      });

      it('should handle joining different show rooms', () => {
        const showIds = ['show-1', 'show-2', 'show-3'];
        
        showIds.forEach(showId => {
          const result = gateway.handleJoinShow(mockClient, showId);
          expect(mockClient.join).toHaveBeenCalledWith(`show:${showId}`);
          expect(result).toEqual({ event: 'joinedShow', data: showId });
        });
      });
    });

    describe('handleLeaveShow', () => {
      it('should leave client from show room and return success response', () => {
        const showId = 'show-123';
        
        const result = gateway.handleLeaveShow(mockClient, showId);
        
        expect(mockClient.leave).toHaveBeenCalledWith(`show:${showId}`);
        expect(result).toEqual({ event: 'leftShow', data: showId });
      });

      it('should log room leave action', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const showId = 'show-456';
        
        gateway.handleLeaveShow(mockClient, showId);
        
        expect(consoleSpy).toHaveBeenCalledWith(`Client ${mockClient.id} left show room: ${showId}`);
        consoleSpy.mockRestore();
      });

      it('should handle leaving different show rooms', () => {
        const showIds = ['show-1', 'show-2', 'show-3'];
        
        showIds.forEach(showId => {
          const result = gateway.handleLeaveShow(mockClient, showId);
          expect(mockClient.leave).toHaveBeenCalledWith(`show:${showId}`);
          expect(result).toEqual({ event: 'leftShow', data: showId });
        });
      });
    });
  });

  describe('Seat Locking Operations', () => {
    describe('handleLockSeat', () => {
      const validData = {
        showId: 'show-123',
        seatId: 'seat-A1',
        userId: 'user-456',
      };

      it('should successfully lock seat when not already locked', async () => {
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, validData);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:seat-A1');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:show-123:seat-A1', 'user-456', 600);
        expect(mockServer.to).toHaveBeenCalledWith('show:show-123');
        expect(mockServer.emit).toHaveBeenCalledWith('seatLocked', {
          showId: 'show-123',
          seatId: 'seat-A1',
          userId: 'user-456',
          expiresAt: expect.any(Number),
        });
      });

      it('should emit error when seat is already locked', async () => {
        mockRedisService.getLock.mockResolvedValue('different-user');

        await gateway.handleLockSeat(mockClient, validData);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Seat already locked' });
        expect(mockRedisService.setLock).not.toHaveBeenCalled();
        expect(mockServer.emit).not.toHaveBeenCalled();
      });

      it('should emit error when Redis operation fails', async () => {
        const error = new Error('Redis connection failed');
        mockRedisService.getLock.mockRejectedValue(error);

        await gateway.handleLockSeat(mockClient, validData);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis connection failed' });
      });

      it('should log successful seat lock', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, validData);

        expect(consoleSpy).toHaveBeenCalledWith(`Seat seat-A1 locked for show show-123 by user user-456`);
        consoleSpy.mockRestore();
      });

      it('should handle locking different seats', async () => {
        const testCases = [
          { showId: 'show-1', seatId: 'seat-B1', userId: 'user-1' },
          { showId: 'show-2', seatId: 'seat-C2', userId: 'user-2' },
          { showId: 'show-3', seatId: 'seat-D3', userId: 'user-3' },
        ];

        for (const testCase of testCases) {
          mockRedisService.getLock.mockResolvedValue(null);
          mockRedisService.setLock.mockResolvedValue('OK');

          await gateway.handleLockSeat(mockClient, testCase);

          expect(mockRedisService.getLock).toHaveBeenCalledWith(`lock:${testCase.showId}:${testCase.seatId}`);
          expect(mockRedisService.setLock).toHaveBeenCalledWith(
            `lock:${testCase.showId}:${testCase.seatId}`,
            testCase.userId,
            600
          );
        }
      });
    });

    describe('handleUnlockSeat', () => {
      const validData = {
        showId: 'show-123',
        seatId: 'seat-A1',
        userId: 'user-456',
      };

      it('should successfully unlock seat when user owns the lock', async () => {
        mockRedisService.getLock.mockResolvedValue('user-456');
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, validData);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:seat-A1');
        expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock:show-123:seat-A1');
        expect(mockServer.to).toHaveBeenCalledWith('show:show-123');
        expect(mockServer.emit).toHaveBeenCalledWith('seatUnlocked', {
          showId: 'show-123',
          seatId: 'seat-A1',
        });
      });

      it('should not unlock seat when locked by different user', async () => {
        mockRedisService.getLock.mockResolvedValue('different-user');

        await gateway.handleUnlockSeat(mockClient, validData);

        expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
        expect(mockServer.emit).not.toHaveBeenCalled();
      });

      it('should not unlock seat when no lock exists', async () => {
        mockRedisService.getLock.mockResolvedValue(null);

        await gateway.handleUnlockSeat(mockClient, validData);

        expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
        expect(mockServer.emit).not.toHaveBeenCalled();
      });

      it('should emit error when Redis operation fails', async () => {
        const error = new Error('Redis connection failed');
        mockRedisService.getLock.mockRejectedValue(error);

        await gateway.handleUnlockSeat(mockClient, validData);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis connection failed' });
      });

      it('should log successful seat unlock', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        mockRedisService.getLock.mockResolvedValue('user-456');
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, validData);

        expect(consoleSpy).toHaveBeenCalledWith(`Seat seat-A1 unlocked for show show-123 by user user-456`);
        consoleSpy.mockRestore();
      });

      it('should handle unlocking different seats', async () => {
        const testCases = [
          { showId: 'show-1', seatId: 'seat-B1', userId: 'user-1' },
          { showId: 'show-2', seatId: 'seat-C2', userId: 'user-2' },
          { showId: 'show-3', seatId: 'seat-D3', userId: 'user-3' },
        ];

        for (const testCase of testCases) {
          mockRedisService.getLock.mockResolvedValue(testCase.userId);
          mockRedisService.deleteLock.mockResolvedValue(1);

          await gateway.handleUnlockSeat(mockClient, testCase);

          expect(mockRedisService.getLock).toHaveBeenCalledWith(`lock:${testCase.showId}:${testCase.seatId}`);
          expect(mockRedisService.deleteLock).toHaveBeenCalledWith(`lock:${testCase.showId}:${testCase.seatId}`);
        }
      });
    });
  });

  describe('Booking Notification', () => {
    describe('notifySeatBooked', () => {
      it('should broadcast seat booking notification', () => {
        const showId = 'show-123';
        const seatIds = ['seat-A1', 'seat-A2', 'seat-B1'];

        gateway.notifySeatBooked(showId, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-123');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-123',
          seatIds: ['seat-A1', 'seat-A2', 'seat-B1'],
        });
      });

      it('should log booking notification', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const showId = 'show-456';
        const seatIds = ['seat-C1'];

        gateway.notifySeatBooked(showId, seatIds);

        expect(consoleSpy).toHaveBeenCalledWith(`Broadcasted permanent booking for seats seat-C1 in show show-456`);
        consoleSpy.mockRestore();
      });

      it('should handle single seat booking', () => {
        const showId = 'show-789';
        const seatIds = ['seat-Z9'];

        gateway.notifySeatBooked(showId, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-789');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-789',
          seatIds: ['seat-Z9'],
        });
      });

      it('should handle multiple seat booking', () => {
        const showId = 'show-999';
        const seatIds = ['seat-A1', 'seat-A2', 'seat-B1', 'seat-B2', 'seat-C1'];

        gateway.notifySeatBooked(showId, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-999');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-999',
          seatIds: ['seat-A1', 'seat-A2', 'seat-B1', 'seat-B2', 'seat-C1'],
        });
      });

      it('should handle empty seat array', () => {
        const showId = 'show-empty';
        const seatIds: string[] = [];

        gateway.notifySeatBooked(showId, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-empty');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-empty',
          seatIds: [],
        });
      });
    });
  });

  describe('Parameter Validation and Edge Cases', () => {
    describe('handleLockSeat - Parameter Validation', () => {
      it('should handle empty showId', async () => {
        const data = { showId: '', seatId: 'seat-A1', userId: 'user-456' };
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock::seat-A1');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock::seat-A1', 'user-456', 600);
      });

      it('should handle empty seatId', async () => {
        const data = { showId: 'show-123', seatId: '', userId: 'user-456' };
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:show-123:', 'user-456', 600);
      });

      it('should handle empty userId', async () => {
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: '' };
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:seat-A1');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:show-123:seat-A1', '', 600);
      });

      it('should handle null values in data', async () => {
        const data = { showId: null, seatId: null, userId: null } as any;
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:null:null');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:null:null', null, 600);
      });

      it('should handle undefined values in data', async () => {
        const data = { showId: undefined, seatId: undefined, userId: undefined } as any;
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:undefined:undefined');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:undefined:undefined', undefined, 600);
      });

      it('should handle very long strings', async () => {
        const longString = 'a'.repeat(1000);
        const data = { showId: longString, seatId: longString, userId: longString };
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith(`lock:${longString}:${longString}`);
        expect(mockRedisService.setLock).toHaveBeenCalledWith(`lock:${longString}:${longString}`, longString, 600);
      });

      it('should handle special characters in parameters', async () => {
        const data = { showId: 'show-123@#$%', seatId: 'seat-A1!@#', userId: 'user-456%^&*' };
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');

        await gateway.handleLockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123@#$%:seat-A1!@#');
        expect(mockRedisService.setLock).toHaveBeenCalledWith('lock:show-123@#$%:seat-A1!@#', 'user-456%^&*', 600);
      });
    });

    describe('handleUnlockSeat - Parameter Validation', () => {
      it('should handle empty showId', async () => {
        const data = { showId: '', seatId: 'seat-A1', userId: 'user-456' };
        mockRedisService.getLock.mockResolvedValue('user-456');
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock::seat-A1');
        expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock::seat-A1');
      });

      it('should handle empty seatId', async () => {
        const data = { showId: 'show-123', seatId: '', userId: 'user-456' };
        mockRedisService.getLock.mockResolvedValue('user-456');
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:');
        expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock:show-123:');
      });

      it('should handle empty userId', async () => {
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: '' };
        mockRedisService.getLock.mockResolvedValue('');
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:show-123:seat-A1');
        expect(mockRedisService.deleteLock).not.toHaveBeenCalled(); // Empty string doesn't match userId
      });

      it('should handle null values in data', async () => {
        const data = { showId: null, seatId: null, userId: null } as any;
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:null:null');
        expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
      });

      it('should handle undefined values in data', async () => {
        const data = { showId: undefined, seatId: undefined, userId: undefined } as any;
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.deleteLock.mockResolvedValue(1);

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockRedisService.getLock).toHaveBeenCalledWith('lock:undefined:undefined');
        expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
      });
    });

    describe('Room Management - Parameter Validation', () => {
      it('should handle empty showId in joinShow', () => {
        const result = gateway.handleJoinShow(mockClient, '');

        expect(mockClient.join).toHaveBeenCalledWith('show:');
        expect(result).toEqual({ event: 'joinedShow', data: '' });
      });

      it('should handle null showId in joinShow', () => {
        const result = gateway.handleJoinShow(mockClient, null as any);

        expect(mockClient.join).toHaveBeenCalledWith('show:null');
        expect(result).toEqual({ event: 'joinedShow', data: null });
      });

      it('should handle undefined showId in joinShow', () => {
        const result = gateway.handleJoinShow(mockClient, undefined as unknown as string);

        expect(mockClient.join).toHaveBeenCalledWith('show:undefined');
        expect(result).toEqual({ event: 'joinedShow', data: undefined });
      });

      it('should handle empty showId in leaveShow', () => {
        const result = gateway.handleLeaveShow(mockClient, '');

        expect(mockClient.leave).toHaveBeenCalledWith('show:');
        expect(result).toEqual({ event: 'leftShow', data: '' });
      });

      it('should handle null showId in leaveShow', () => {
        const result = gateway.handleLeaveShow(mockClient, null as any);

        expect(mockClient.leave).toHaveBeenCalledWith('show:null');
        expect(result).toEqual({ event: 'leftShow', data: null });
      });

      it('should handle undefined showId in leaveShow', () => {
        const result = gateway.handleLeaveShow(mockClient, undefined as any);

        expect(mockClient.leave).toHaveBeenCalledWith('show:undefined');
        expect(result).toEqual({ event: 'leftShow', data: undefined });
      });
    });

    describe('notifySeatBooked - Parameter Validation', () => {
      it('should handle null showId', () => {
        const seatIds = ['seat-A1', 'seat-A2'];

        gateway.notifySeatBooked(null as any, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:null');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: null,
          seatIds: ['seat-A1', 'seat-A2'],
        });
      });

      it('should handle undefined showId', () => {
        const seatIds = ['seat-A1', 'seat-A2'];

        gateway.notifySeatBooked(undefined as any, seatIds);

        expect(mockServer.to).toHaveBeenCalledWith('show:undefined');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: undefined,
          seatIds: ['seat-A1', 'seat-A2'],
        });
      });

      it('should handle null seatIds', () => {
        const showId = 'show-123';
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        gateway.notifySeatBooked(showId, null as any);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-123');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-123',
          seatIds: null,
        });
        consoleSpy.mockRestore();
      });

      it('should handle undefined seatIds', () => {
        const showId = 'show-123';
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        gateway.notifySeatBooked(showId, undefined as any);

        expect(mockServer.to).toHaveBeenCalledWith('show:show-123');
        expect(mockServer.emit).toHaveBeenCalledWith('seatsBooked', {
          showId: 'show-123',
          seatIds: undefined,
        });
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Redis Service Integration', () => {
    describe('Redis Return Value Debug', () => {
      it('should debug Redis return value handling', async () => {
        mockRedisService.getLock.mockResolvedValue('user-123');
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Seat already locked' });
        expect(mockRedisService.setLock).not.toHaveBeenCalled();
      });
    });

    describe('Redis Error Handling', () => {
      it('should handle getLock throwing error in lockSeat', async () => {
        const error = new Error('Redis getLock failed');
        mockRedisService.getLock.mockRejectedValue(error);
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };

        await gateway.handleLockSeat(mockClient, data);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis getLock failed' });
      });

      it('should handle setLock throwing error in lockSeat', async () => {
        const error = new Error('Redis setLock failed');
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockRejectedValue(error);
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };

        await gateway.handleLockSeat(mockClient, data);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis setLock failed' });
      });

      it('should handle getLock throwing error in unlockSeat', async () => {
        const error = new Error('Redis getLock failed');
        mockRedisService.getLock.mockRejectedValue(error);
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis getLock failed' });
      });

      it('should handle deleteLock throwing error in unlockSeat', async () => {
        const error = new Error('Redis deleteLock failed');
        mockRedisService.getLock.mockResolvedValue('user-456');
        mockRedisService.deleteLock.mockRejectedValue(error);
        const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };

        await gateway.handleUnlockSeat(mockClient, data);

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Redis deleteLock failed' });
      });
    });

    describe('Redis Return Value Handling', () => {
      it('should handle existing lock in lockSeat', async () => {
        mockRedisService.getLock.mockResolvedValue('user-123');
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Seat already locked' });
        expect(mockRedisService.setLock).not.toHaveBeenCalled();
      });

      it('should handle empty string lock in lockSeat', async () => {
        mockRedisService.getLock.mockResolvedValue('');
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).not.toHaveBeenCalledWith('error', expect.any(Object));
        expect(mockRedisService.setLock).toHaveBeenCalled();
      });

      it('should handle zero string lock in lockSeat', async () => {
        mockRedisService.getLock.mockResolvedValue('0');
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Seat already locked' });
        expect(mockRedisService.setLock).not.toHaveBeenCalled();
      });

      it('should handle null lock in lockSeat', async () => {
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).not.toHaveBeenCalledWith('error', expect.any(Object));
        expect(mockRedisService.setLock).toHaveBeenCalled();
      });

      it('should handle undefined lock in lockSeat', async () => {
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');
        mockClient.emit.mockClear();

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).not.toHaveBeenCalledWith('error', expect.any(Object));
        expect(mockRedisService.setLock).toHaveBeenCalled();
      });

      it('should handle various Redis getLock return values in unlockSeat', async () => {
        const testCases = [
          { returnValue: 'user-456', shouldUnlock: true },
          { returnValue: 'different-user', shouldUnlock: false },
          { returnValue: '', shouldUnlock: false },
          { returnValue: '0', shouldUnlock: false },
          { returnValue: null, shouldUnlock: false },
          { returnValue: undefined, shouldUnlock: false },
        ];

        for (const testCase of testCases) {
          mockRedisService.getLock.mockClear();
          mockRedisService.deleteLock.mockClear();
          mockServer.emit.mockClear();
          
          mockRedisService.getLock.mockResolvedValue(testCase.returnValue as any);
          mockRedisService.deleteLock.mockResolvedValue(1);

          await gateway.handleUnlockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

          if (testCase.shouldUnlock) {
            expect(mockServer.emit).toHaveBeenCalledWith('seatUnlocked', expect.any(Object));
            expect(mockRedisService.deleteLock).toHaveBeenCalled();
          } else {
            expect(mockServer.emit).not.toHaveBeenCalledWith('seatUnlocked', expect.any(Object));
            expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
          }
        }
      });
    });
  });

  describe('Socket.io Integration', () => {
    describe('Server Broadcasting', () => {
      it('should handle server.to method chaining correctly', async () => {
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');
        
        const mockTo = jest.fn().mockReturnThis();
        const mockEmit = jest.fn();
        mockServer.to = mockTo;
        mockServer.emit = mockEmit;

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockTo).toHaveBeenCalledWith('show:show-123');
        expect(mockEmit).toHaveBeenCalledWith('seatLocked', expect.any(Object));
      });

      it('should handle multiple broadcasts to different rooms', async () => {
        mockRedisService.getLock.mockResolvedValue(null);
        mockRedisService.setLock.mockResolvedValue('OK');
        
        const rooms = ['show-1', 'show-2', 'show-3'];
        
        for (const room of rooms) {
          await gateway.handleLockSeat(mockClient, { showId: room, seatId: 'seat-A1', userId: 'user-456' });
        }

        expect(mockServer.to).toHaveBeenCalledTimes(3);
        expect(mockServer.to).toHaveBeenCalledWith('show:show-1');
        expect(mockServer.to).toHaveBeenCalledWith('show:show-2');
        expect(mockServer.to).toHaveBeenCalledWith('show:show-3');
      });
    });

    describe('Client Emission', () => {
      it('should handle client.emit method calls correctly', async () => {
        const error = new Error('Test error');
        mockRedisService.getLock.mockRejectedValue(error);

        await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

        expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Test error' });
      });

      it('should handle multiple client emissions', async () => {
        const errors = [
          new Error('Error 1'),
          new Error('Error 2'),
          new Error('Error 3'),
        ];

        for (const error of errors) {
          mockRedisService.getLock.mockRejectedValue(error);
          mockClient.emit.mockClear();

          await gateway.handleLockSeat(mockClient, { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' });

          expect(mockClient.emit).toHaveBeenCalledWith('error', { message: error.message });
        }
      });
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent lock requests for same seat', async () => {
      const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };
      
      // First request succeeds
      mockRedisService.getLock.mockResolvedValueOnce(null);
      mockRedisService.setLock.mockResolvedValueOnce('OK');
      
      // Second request fails (already locked)
      mockRedisService.getLock.mockResolvedValueOnce('user-456');

      const firstRequest = gateway.handleLockSeat(mockClient, data);
      const secondRequest = gateway.handleLockSeat(mockClient, data);

      await Promise.all([firstRequest, secondRequest]);

      expect(mockRedisService.setLock).toHaveBeenCalledTimes(1);
      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Seat already locked' });
    });

    it('should handle concurrent unlock requests', async () => {
      const data = { showId: 'show-123', seatId: 'seat-A1', userId: 'user-456' };
      
      mockRedisService.getLock.mockResolvedValue('user-456');
      mockRedisService.deleteLock.mockResolvedValue(1);

      const firstUnlock = gateway.handleUnlockSeat(mockClient, data);
      const secondUnlock = gateway.handleUnlockSeat(mockClient, data);

      await Promise.all([firstUnlock, secondUnlock]);

      expect(mockRedisService.deleteLock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high volume of lock requests', async () => {
      const requests: Promise<void>[] = [];
      const numRequests = 100;

      mockRedisService.getLock.mockResolvedValue(null);
      mockRedisService.setLock.mockResolvedValue('OK');

      for (let i = 0; i < numRequests; i++) {
        const data = { showId: `show-${i}`, seatId: `seat-${i}`, userId: `user-${i}` };
        requests.push(gateway.handleLockSeat(mockClient, data));
      }

      await Promise.all(requests);

      expect(mockRedisService.getLock).toHaveBeenCalledTimes(numRequests);
      expect(mockRedisService.setLock).toHaveBeenCalledTimes(numRequests);
    });

    it('should handle high volume of unlock requests', async () => {
      const requests: Promise<void>[] = [];
      const numRequests = 100;

      mockRedisService.getLock.mockResolvedValue('user-456');
      mockRedisService.deleteLock.mockResolvedValue(1);

      for (let i = 0; i < numRequests; i++) {
        const data = { showId: `show-${i}`, seatId: `seat-${i}`, userId: 'user-456' };
        requests.push(gateway.handleUnlockSeat(mockClient, data));
      }

      await Promise.all(requests);

      expect(mockRedisService.getLock).toHaveBeenCalledTimes(numRequests);
      expect(mockRedisService.deleteLock).toHaveBeenCalledTimes(numRequests);
    });
  });
});
