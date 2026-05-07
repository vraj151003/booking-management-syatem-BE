import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermissions('MANAGE_PAYMENT')
  @ApiOperation({ summary: 'Get all payments with filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentIntentId', required: false })
  @ApiQuery({ name: 'transactionId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiQuery({ name: 'minAmount', required: false })
  @ApiQuery({ name: 'maxAmount', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'currency', required: false })
  async findAllPayments(@Query() filters: PaymentFilterDto) {
    return this.paymentService.findAllPayments(filters);
  }

  @Get('user/:userId')
  @RequirePermissions('READ_USER_PAYMENTS')
  @ApiOperation({ summary: 'Get payments by user with filters' })
  @ApiResponse({ status: 200, description: 'User payments retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentIntentId', required: false })
  @ApiQuery({ name: 'transactionId', required: false })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiQuery({ name: 'minAmount', required: false })
  @ApiQuery({ name: 'maxAmount', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'currency', required: false })
  async findPaymentsByUser(
    @Param('userId') userId: string,
    @Query() filters: PaymentFilterDto
  ) {
    return this.paymentService.findPaymentsByUser(userId, filters);
  }
}
