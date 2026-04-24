import { Body, Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking-dto';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Show not found' })
  async create(@Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto);
  }

  @Get()
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async findAll() {
    return this.bookingService.findAllBookings();
  }

  @Get(':id')
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string) {
    return this.bookingService.findOneBooking(id);
  }

  @Get('user/:userId')
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Get bookings by user ID' })
  @ApiResponse({ status: 200, description: 'User bookings retrieved successfully' })
  async findByUser(@Param('userId') userId: string) {
    return this.bookingService.findBookingsByUser(userId);
  }

  @Delete(':id')
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }
}
