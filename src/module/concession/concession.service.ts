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
  ) {}

  // Concession Management
  async createConcession(createConcessionDto: CreateConcessionDto): Promise<Concession> {
    const concession = this.concessionRepo.create(createConcessionDto);
    return this.concessionRepo.save(concession);
  }

  async getConcessionsByTheater(theaterOwnerId: string): Promise<Concession[]> {
    return this.concessionRepo.find({
      where: { theaterOwner: { id: theaterOwnerId } },
      relations: ['category'],
    });
  }

  async getConcessionsByCategory(categoryId: number): Promise<Concession[]> {
    return this.concessionRepo.find({
      where: { status: ConcessionStatus.ACTIVE },
      relations: ['category'],
    });
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

  async getCategories(): Promise<ConcessionCategory[]> {
    return this.categoryRepo.find({ 
      where: { isActive: true },
      order: { displayOrder: 'ASC' }
    });
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

  async createConcessionOrder(createOrderDto: CreateConcessionOrderDto): Promise<ConcessionOrder> {
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
    await this.orderRepo.save(savedOrder);

    return savedOrder;
  }

  async getConcessionOrdersByUser(userId: string): Promise<ConcessionOrder[]> {
    return this.orderRepo.find({
      where: { user: { id: userId } },
      relations: ['orderItems', 'orderItems.concession'],
    });
  }

  async getConcessionOrdersByBooking(bookingId: string): Promise<ConcessionOrder[]> {
    return this.orderRepo.find({
      where: { booking: { id: bookingId } },
      relations: ['orderItems', 'orderItems.concession'],
    });
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
