import { Body, Controller, Get, Post, Param, Delete, UseGuards, Res, StreamableFile, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking-dto';
import { LockSeatsDto } from './dto/lock-seats-dto';
import { ExportBookingsDto, ExportFilterType } from './dto/export-bookings-dto';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('lock-seats')
  @RequirePermissions('CREATE_BOOKING')
  @ApiOperation({ summary: 'Lock seats for booking' })
  @ApiResponse({ status: 200, description: 'Seats locked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async lockSeats(@Body() dto: LockSeatsDto) {
    return this.bookingService.lockSeats(dto.showId, dto.seatIds, dto.userId);
  }

  @Post()
  @RequirePermissions('CREATE_BOOKING')
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

  @Get('theater-owner/:theaterOwnerId')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get bookings by theater owner' })
  @ApiResponse({ status: 200, description: 'Theater owner bookings retrieved successfully' })
  async findByTheaterOwner(@Param('theaterOwnerId') theaterOwnerId: string) {
    return this.bookingService.findBookingsByTheaterOwner(theaterOwnerId);
  }

  @Delete(':id')
  @RequirePermissions('CREATE_BOOKING')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }

  @Get(':id/ticket')
  @RequirePermissions('MANAGE_BOOKING')
  @ApiOperation({ summary: 'Download booking ticket as PDF' })
  @ApiResponse({ status: 200, description: 'PDF ticket generated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async downloadTicket(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.bookingService.generateTicketPdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate booking barcode' })
  @ApiResponse({ status: 200, description: 'Booking validated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async validateBarcode(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.bookingService.validateBarcode(id);
    
    // Return HTML for mobile scanning, JSON for API calls
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Validation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: ${result.valid ? '#4caf50' : '#f44336'};
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 400px;
              width: 90%;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              color: ${result.valid ? '#4caf50' : '#f44336'};
              margin: 0 0 10px 0;
            }
            .message {
              font-size: 24px;
              color: #333;
              margin-bottom: 20px;
            }
            .details {
              text-align: left;
              background: #f5f5f5;
              padding: 20px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .detail-item {
              margin: 10px 0;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${result.valid ? '✓' : '✗'}</div>
            <h1>${result.valid ? 'VALID ENTRY' : 'INVALID'}</h1>
            <div class="message">${result.message}</div>
            <div class="details">
              <div class="detail-item"><span class="label">Movie:</span> ${result.booking.movieTitle}</div>
              <div class="detail-item"><span class="label">Date:</span> ${result.booking.showDate}</div>
              <div class="detail-item"><span class="label">Time:</span> ${result.booking.showTime}</div>
              <div class="detail-item"><span class="label">Screen:</span> ${result.booking.screen}</div>
              <div class="detail-item"><span class="label">Seats:</span> ${result.booking.seats.join(', ')}</div>
            </div>
          </div>
        </body>
        </html>
      `;
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.json(result);
    }
  }

  @Get('export/csv')
  @RequirePermissions('EXPORT_BOOKINGS_CSV')
  @ApiOperation({ summary: 'Export bookings to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  @ApiQuery({ name: 'filterType', enum: ExportFilterType, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'movieId', required: false })
  @ApiQuery({ name: 'screenId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  async exportBookings(
    @Query('theaterOwnerId') theaterOwnerId: string,
    @Query() filters: ExportBookingsDto,
    @Res() res: Response,
  ) {
    const csvBuffer = await this.bookingService.exportBookingsToCsv(theaterOwnerId, filters);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bookings-export-${Date.now()}.csv"`,
      'Content-Length': csvBuffer.length,
    });
    
    res.send(csvBuffer);
  }
}
