import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseService } from './firebase.service';
import { DeviceToken } from './entity/device-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ApiTags('Firebase')
@Controller('firebase')
export class FirebaseController {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('device-token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered successfully' })
  async registerDeviceToken(
    @Body() body: { 
      token: string; 
      deviceType: 'ios' | 'android'; 
    },
    @Request() req: Request,
  ) {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return { success: false, message: 'User ID not found' };
    }

    // Check if token already exists for this user
    const existingToken = await this.deviceTokenRepo.findOne({
      where: { 
        userId, 
        token: body.token, 
        isActive: true 
      },
    });

    if (existingToken) {
      // Deactivate existing token
      existingToken.isActive = false;
      await this.deviceTokenRepo.save(existingToken);
    }

    // Create new device token
    const deviceToken = this.deviceTokenRepo.create({
      userId,
      token: body.token,
      deviceType: body.deviceType,
      isActive: true,
    });

    await this.deviceTokenRepo.save(deviceToken);

    return { 
      success: true, 
      message: 'Device token registered successfully' 
    };
  }

  @Get('device-tokens')
  @ApiOperation({ summary: 'Get all device tokens for current user' })
  @ApiResponse({ status: 200, description: 'Device tokens retrieved successfully' })
  async getDeviceTokens(@Request() req: Request) {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return { success: false, message: 'User ID not found' };
    }

    const deviceTokens = await this.deviceTokenRepo.find({
      where: { 
        userId, 
        isActive: true 
      },
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      data: deviceTokens,
      message: 'Device tokens retrieved successfully',
    };
  }

  @Delete('device-token/:tokenId')
  @ApiOperation({ summary: 'Remove device token' })
  @ApiResponse({ status: 200, description: 'Device token removed successfully' })
  async removeDeviceToken(
    @Param('tokenId') tokenId: string,
    @Request() req: Request,
  ) {
    const userId = (req as any).user?.id;

    if (!userId) {
      return { success: false, message: 'User ID not found' };
    }

    const deviceToken = await this.deviceTokenRepo.findOne({
      where: { 
        id: tokenId, 
        userId 
      },
    });

    if (!deviceToken) {
      return { success: false, message: 'Device token not found' };
    }

    // Deactivate the token instead of deleting to maintain history
    deviceToken.isActive = false;
    await this.deviceTokenRepo.save(deviceToken);

    return {
      success: true,
      message: 'Device token removed successfully',
    };
  }

  // Test endpoints for Firebase service
  @Post('test/register-token')
  @ApiOperation({ summary: 'Test: Register device token for testing' })
  @ApiResponse({ status: 201, description: 'Test device token registered successfully' })
  async testRegisterDeviceToken(
    @Body() body: { 
      userId: string;
      token: string; 
      deviceType: 'ios' | 'android'; 
    },
  ) {
    try {
      // For testing, we'll validate the userId format
      // If it's not a valid UUID, we'll still proceed but handle it gracefully
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId);
      
      if (!isValidUUID) {
        // without actually saving to the database to avoid UUID constraint errors
        const mockDeviceToken = {
          id: `test-token-${Date.now()}`,
          userId: body.userId,
          token: body.token,
          deviceType: body.deviceType,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return { 
          success: true, 
          message: 'Test device token registered successfully (mock mode)',
          data: mockDeviceToken,
        };
      }

      // For valid UUIDs, proceed with normal database operations
      const existingToken = await this.deviceTokenRepo.findOne({
        where: { 
          userId: body.userId, 
          token: body.token, 
          isActive: true 
        },
      });

      if (existingToken) {
        // Deactivate existing token
        existingToken.isActive = false;
        await this.deviceTokenRepo.save(existingToken);
      }

      // Create new device token
      const deviceToken = this.deviceTokenRepo.create({
        userId: body.userId,
        token: body.token,
        deviceType: body.deviceType,
        isActive: true,
      });

      await this.deviceTokenRepo.save(deviceToken);

      return { 
        success: true, 
        message: 'Test device token registered successfully',
        data: deviceToken,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to register test device token: ${error.message}`,
      };
    }
  }

  @Post('test/send-notification')
  @ApiOperation({ summary: 'Test: Send push notification to specific tokens' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async testSendNotification(
    @Body() body: {
      tokens: string[];
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    const result = await this.firebaseService.sendPushNotification(
      body.tokens,
      {
        title: body.title,
        body: body.body,
        data: body.data,
      },
    );

    return {
      success: true,
      message: 'Test notification sent',
      result,
    };
  }

  @Post('test/send-notification-to-user')
  @ApiOperation({ summary: 'Test: Send push notification to user' })
  @ApiResponse({ status: 200, description: 'Test notification sent to user' })
  async testSendNotificationToUser(
    @Body() body: {
      userId: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    const result = await this.firebaseService.sendPushNotificationToUser(
      body.userId,
      {
        title: body.title,
        body: body.body,
        data: body.data,
      },
    );

    return {
      success: true,
      message: 'Test notification sent to user',
      result,
    };
  }

  @Post('test/booking-confirmation')
  @ApiOperation({ summary: 'Test: Send booking confirmation notification' })
  @ApiResponse({ status: 200, description: 'Test booking confirmation sent' })
  async testBookingConfirmation(
    @Body() body: {
      userId: string;
      bookingData: {
        bookingId: string;
        movieName: string;
        showDate: string;
        showTime: string;
        screenName: string;
        seats: string[];
        totalAmount: number;
      };
    },
  ) {
    await this.firebaseService.sendBookingConfirmationToCustomer(
      body.userId,
      body.bookingData,
    );

    return {
      success: true,
      message: 'Test booking confirmation sent',
    };
  }

  @Post('test/payment-notification')
  @ApiOperation({ summary: 'Test: Send payment notification' })
  @ApiResponse({ status: 200, description: 'Test payment notification sent' })
  async testPaymentNotification(
    @Body() body: {
      userId: string;
      paymentData: {
        paymentId: string;
        amount: number;
        status: 'success' | 'failed';
        movieName?: string;
        bookingId?: string;
      };
    },
  ) {
    await this.firebaseService.sendPaymentNotification(
      body.userId,
      body.paymentData,
    );

    return {
      success: true,
      message: 'Test payment notification sent',
    };
  }

  @Get('test/status')
  @ApiOperation({ summary: 'Test: Check Firebase configuration status' })
  @ApiResponse({ status: 200, description: 'Firebase status checked' })
  async testFirebaseStatus() {
    const isConfigured = this.firebaseService.isConfigured();
    
    return {
      success: true,
      message: 'Firebase status checked',
      data: {
        configured: isConfigured,
        status: isConfigured ? 'Firebase is properly configured' : 'Firebase is not configured',
      },
    };
  }
}
