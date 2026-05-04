import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConcessionService } from './concession.service';
import { CreateConcessionDto } from './dto/create-concession.dto';
import { UpdateConcessionDto } from './dto/update-concession.dto';
import { CreateConcessionOrderDto } from './dto/create-concession-order.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConcessionStatus } from './entity/concession.entity';
import { ConcessionOrderStatus } from './entity/concession-order.entity';

@ApiTags('concessions')
@Controller('concessions')
export class ConcessionController {
  constructor(private readonly concessionService: ConcessionService) {}

  // Concession Management
  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('CREATE_CONCESSION')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new concession item' })
  @ApiResponse({ status: 201, description: 'Concession created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createConcession(@Body() createConcessionDto: CreateConcessionDto) {
    return {
      message: 'Concession created successfully',
      data: await this.concessionService.createConcession(createConcessionDto),
    };
  }

  @Get('theater/:theaterId')
  @RequirePermissions('READ_CONCESSION')
  @ApiOperation({ summary: 'Get concessions by theater' })
  @ApiResponse({ status: 200, description: 'Concessions retrieved successfully' })
  async getConcessionsByTheater(@Param('theaterId') theaterId: string) {
    return {
      message: 'Concessions retrieved successfully',
      data: await this.concessionService.getConcessionsByTheater(theaterId),
    };
  }

  @Get('category/:categoryId')
  @RequirePermissions('READ_CONCESSION')
  @ApiOperation({ summary: 'Get concessions by category' })
  @ApiResponse({ status: 200, description: 'Concessions retrieved successfully' })
  async getConcessionsByCategory(@Param('categoryId') categoryId: number) {
    return {
      message: 'Concessions retrieved successfully',
      data: await this.concessionService.getConcessionsByCategory(categoryId),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('UPDATE_CONCESSION')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update concession item' })
  @ApiResponse({ status: 200, description: 'Concession updated successfully' })
  @ApiResponse({ status: 404, description: 'Concession not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateConcession(
    @Param('id') id: number,
    @Body() updateConcessionDto: UpdateConcessionDto,
  ) {
    return {
      message: 'Concession updated successfully',
      data: await this.concessionService.updateConcession(id, updateConcessionDto),
    };
  }

  @Post(':id/stock')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('UPDATE_CONCESSION_STOCK')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update concession stock' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 404, description: 'Concession not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStock(
    @Param('id') id: number,
    @Body('quantity') quantity: number,
  ) {
    await this.concessionService.updateStock(id, quantity);
    return {
      message: 'Stock updated successfully',
    };
  }

  // Category Management
  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('CREATE_CONCESSION_CATEGORY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create concession category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return {
      message: 'Category created successfully',
      data: await this.concessionService.createCategory(createCategoryDto.name, createCategoryDto.description),
    };
  }

  @Get('categories')
  @RequirePermissions('READ_CONCESSION_CATEGORY')
  @ApiOperation({ summary: 'Get all concession categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return {
      message: 'Categories retrieved successfully',
      data: await this.concessionService.getCategories(),
    };
  }

  @Get('categories/:id')
  @RequirePermissions('READ_CONCESSION_CATEGORY')
  @ApiOperation({ summary: 'Get concession category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id') id: number) {
    return {
      message: 'Category retrieved successfully',
      data: await this.concessionService.getCategoryById(id),
    };
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('UPDATE_CONCESSION_CATEGORY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update concession category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCategory(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return {
      message: 'Category updated successfully',
      data: await this.concessionService.updateCategory(id, updateCategoryDto),
    };
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('DELETE_CONCESSION_CATEGORY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete concession category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteCategory(@Param('id') id: number) {
    await this.concessionService.deleteCategory(id);
    return {
      message: 'Category deleted successfully',
    };
  }

  // Order Management
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('CREATE_CONCESSION_ORDER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create concession order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createConcessionOrder(@Body() createOrderDto: CreateConcessionOrderDto) {
    return {
      message: 'Concession order created successfully',
      data: await this.concessionService.createConcessionOrder(createOrderDto),
    };
  }

  @Get('orders/user/:userId')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('READ_CONCESSION_ORDERS_BY_USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get concession orders by user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrdersByUser(@Param('userId') userId: string) {
    return {
      message: 'Orders retrieved successfully',
      data: await this.concessionService.getConcessionOrdersByUser(userId),
    };
  }

  @Get('orders/booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('READ_CONCESSION_ORDERS_BY_BOOKING')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get concession orders by booking' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrdersByBooking(@Param('bookingId') bookingId: string) {
    return {
      message: 'Orders retrieved successfully',
      data: await this.concessionService.getConcessionOrdersByBooking(bookingId),
    };
  }

  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('UPDATE_CONCESSION_ORDER_STATUS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update concession order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOrderStatus(
    @Param('id') id: number,
    @Body('status') status: ConcessionOrderStatus,
  ) {
    await this.concessionService.updateOrderStatus(id, status);
    return {
      message: 'Order status updated successfully',
    };
  }

  @Post('orders/:id/pay')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('MARK_CONCESSION_ORDER_PAID')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark concession order as paid' })
  @ApiResponse({ status: 200, description: 'Order marked as paid successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markOrderAsPaid(
    @Param('id') id: number,
    @Body('paymentReference') paymentReference: string,
  ) {
    await this.concessionService.markOrderAsPaid(id, paymentReference);
    return {
      message: 'Order marked as paid successfully',
    };
  }

  @Get('check-stock/:concessionId')
  @RequirePermissions('CHECK_CONCESSION_STOCK')
  @ApiOperation({ summary: 'Check stock availability for concession' })
  @ApiQuery({ name: 'quantity', required: true, description: 'Quantity to check' })
  @ApiResponse({ status: 200, description: 'Stock availability checked successfully' })
  async checkStockAvailability(
    @Param('concessionId') concessionId: number,
    @Query('quantity') quantity: number,
  ) {
    const isAvailable = await this.concessionService.checkStockAvailability(concessionId, quantity);
    return {
      message: 'Stock availability checked successfully',
      data: { concessionId, quantity, isAvailable },
    };
  }
}
