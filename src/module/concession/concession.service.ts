import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Concession, ConcessionStatus } from './entity/concession.entity';
import { ConcessionCategory } from './entity/concession-category.entity';
import { ConcessionOrder, ConcessionOrderStatus } from './entity/concession-order.entity';
import { ConcessionOrderItem } from './entity/concession-order-item.entity';
import { CreateConcessionDto } from './dto/create-concession.dto';
import { CreateConcessionOrderDto } from './dto/create-concession-order.dto';
import {  UpdateConcessionDto } from './dto/update-concession.dto';
import { ConcessionFilterDto, ConcessionOrderFilterDto, ConcessionCategoryFilterDto } from './dto/concession-filter.dto';
import { StripeService } from '../payment/stripe/stripe.service';

@Injectable()
export class ConcessionService {
  constructor(
    @InjectRepository(Concession)
    private readonly concessionRepo: Repository<Concession>,
    @InjectRepository(ConcessionCategory)
    private readonly categoryRepo: Repository<ConcessionCategory>,
    @InjectRepository(ConcessionOrder)
    private readonly orderRepo: Repository<ConcessionOrder>,
    @InjectRepository(ConcessionOrderItem)
    private readonly orderItemRepo: Repository<ConcessionOrderItem>,
    private readonly stripeService: StripeService,
  ) {}

  // Concession Management
  async createConcession(createConcessionDto: CreateConcessionDto): Promise<Concession> {
    const concession = this.concessionRepo.create(createConcessionDto);
    return this.concessionRepo.save(concession);
  }

  async getConcessionsByTheater(theaterOwnerId: string, filters?: ConcessionFilterDto): Promise<Concession[]> {
    const queryBuilder = this.concessionRepo
      .createQueryBuilder('concession')
      .leftJoinAndSelect('concession.category', 'category')
      .where('concession.theaterOwner.id = :theaterOwnerId', { theaterOwnerId });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(concession.name) LIKE LOWER(:search) OR LOWER(concession.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('concession.status = :status', { status: filters.status });
    }

    // Apply category filter
    if (filters?.categoryId) {
      queryBuilder.andWhere('concession.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    // Apply low stock filter
    if (filters?.lowStock) {
      queryBuilder.andWhere('concession.stockQuantity <= concession.minStockThreshold');
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('concession.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('concession.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder.getMany();
  }

  async getConcessionsByCategory(categoryId: number, filters?: ConcessionFilterDto): Promise<Concession[]> {
    const queryBuilder = this.concessionRepo
      .createQueryBuilder('concession')
      .leftJoinAndSelect('concession.category', 'category')
      .where('concession.categoryId = :categoryId', { categoryId });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(concession.name) LIKE LOWER(:search) OR LOWER(concession.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('concession.status = :status', { status: filters.status });
    }

    // Apply theater owner filter
    if (filters?.theaterOwnerId) {
      queryBuilder.andWhere('concession.theaterOwnerId = :theaterOwnerId', { theaterOwnerId: filters.theaterOwnerId });
    }

    // Apply low stock filter
    if (filters?.lowStock) {
      queryBuilder.andWhere('concession.stockQuantity <= concession.minStockThreshold');
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('concession.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('concession.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder.getMany();
  }

  async updateConcession(id: number, updateConcessionDto: UpdateConcessionDto): Promise<Concession | null> {
    await this.concessionRepo.update(id, updateConcessionDto);
    return this.concessionRepo.findOne({ where: { id } });
  }

  async updateStock(id: number, quantity: number): Promise<void> {
    await this.concessionRepo.increment({ id }, 'stockQuantity', quantity);
  }

  async checkStockAvailability(concessionId: number, quantity: number): Promise<boolean> {
    const concession = await this.concessionRepo.findOne({ where: { id: concessionId } });
    return concession !== null && concession.stockQuantity >= quantity && concession.status === ConcessionStatus.ACTIVE;
  }

  async createCategory(name: string, description: string): Promise<ConcessionCategory> {
    const category = this.categoryRepo.create({ name, description });
    return this.categoryRepo.save(category);
  }

  async getCategories(filters?: ConcessionCategoryFilterDto): Promise<ConcessionCategory[]> {
    const queryBuilder = this.categoryRepo.createQueryBuilder('category');

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(category.name) LIKE LOWER(:search) OR LOWER(category.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply active status filter
    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: filters.isActive });
    } else {
      // Default to active categories if not specified
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    return await queryBuilder.orderBy('category.displayOrder', 'ASC').getMany();
  }

  async getCategoryById(id: number): Promise<ConcessionCategory | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async updateCategory(id: number, updateCategoryDto: any): Promise<ConcessionCategory | null> {
    await this.categoryRepo.update(id, updateCategoryDto);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categoryRepo.update(id, { isActive: false });
  }

  async createConcessionOrder(createOrderDto: CreateConcessionOrderDto): Promise<ConcessionOrder & { clientSecret?: string }> {
    // Check stock availability
    for (const item of createOrderDto.items) {
      const isAvailable = await this.checkStockAvailability(item.concessionId, item.quantity);
      if (!isAvailable) {
        throw new Error(`Insufficient stock for concession ${item.concessionId}`);
      }
    }

    const order = this.orderRepo.create({
      booking: { id: createOrderDto.bookingId },
      user: { id: createOrderDto.userId },
      totalAmount: 0, // Will be calculated
      pickupTime: createOrderDto.pickupTime,
      showStartTime: createOrderDto.showStartTime,
      specialInstructions: createOrderDto.specialInstructions,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Create order items and calculate total
    let totalAmount = 0;
    for (const item of createOrderDto.items) {
      const concession = await this.concessionRepo.findOne({ where: { id: item.concessionId } });
      if (!concession) {
        throw new Error(`Concession not found: ${item.concessionId}`);
      }
      const unitPrice = concession.price;
      const totalPrice = unitPrice * item.quantity;

      const orderItem = this.orderItemRepo.create({
        concessionOrder: savedOrder,
        concession: { id: item.concessionId },
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        customization: item.customization,
      });

      await this.orderItemRepo.save(orderItem);
      totalAmount += totalPrice;

      // Update stock
      await this.updateStock(item.concessionId, -item.quantity);
    }

    // Update order total
    savedOrder.totalAmount = totalAmount;
    savedOrder.estimatedPreparationTime = this.calculatePreparationTime(createOrderDto.items);
    
    // Create Stripe Payment Intent
    const paymentIntent = await this.stripeService.createPaymentIntent(totalAmount, {
      type: 'concession',
      orderId: savedOrder.id.toString(),
      userId: createOrderDto.userId,
    });
    
    savedOrder.paymentReference = paymentIntent.id;
    await this.orderRepo.save(savedOrder);

    return {
      ...savedOrder,
      clientSecret: paymentIntent.client_secret,
    } as any;
  }

  async getConcessionOrdersByUser(userId: string, filters?: ConcessionOrderFilterDto): Promise<ConcessionOrder[]> {
    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.concession', 'concession')
      .where('order.user.id = :userId', { userId });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(concession.name) LIKE LOWER(:search) OR LOWER(order.specialInstructions) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    // Apply booking filter
    if (filters?.bookingId) {
      queryBuilder.andWhere('order.bookingId = :bookingId', { bookingId: filters.bookingId });
    }

    // Apply paid status filter
    if (filters?.isPaid !== undefined) {
      queryBuilder.andWhere('order.isPaid = :isPaid', { isPaid: filters.isPaid });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder.getMany();
  }

  async getConcessionOrdersByBooking(bookingId: string, filters?: ConcessionOrderFilterDto): Promise<ConcessionOrder[]> {
    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.concession', 'concession')
      .where('order.booking.id = :bookingId', { bookingId });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(concession.name) LIKE LOWER(:search) OR LOWER(order.specialInstructions) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    // Apply user filter
    if (filters?.userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    // Apply paid status filter
    if (filters?.isPaid !== undefined) {
      queryBuilder.andWhere('order.isPaid = :isPaid', { isPaid: filters.isPaid });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder.getMany();
  }

  async updateOrderStatus(orderId: number, status: ConcessionOrderStatus): Promise<void> {
    await this.orderRepo.update(orderId, { status });
  }

  async markOrderAsPaid(orderId: number, paymentReference: string): Promise<void> {
    await this.orderRepo.update(orderId, { 
      isPaid: true, 
      paymentReference,
      status: ConcessionOrderStatus.CONFIRMED 
    });
  }

  private calculatePreparationTime(items: any[]): number {
    // Calculate max preparation time from all items
    let maxTime = 0;
    for (const item of items) {
      // This would need concession data to get preparation time
      // For now, return default
      maxTime = Math.max(maxTime, 5);
    }
    return maxTime;
  }
}
