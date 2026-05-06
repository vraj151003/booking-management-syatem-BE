import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcessionService } from './concession.service';
import { ConcessionController } from './concession.controller';
import { AuditModule } from '../audit/audit.module';
import { Concession } from './entity/concession.entity';
import { ConcessionCategory } from './entity/concession-category.entity';
import { ConcessionOrder } from './entity/concession-order.entity';
import { ConcessionOrderItem } from './entity/concession-order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Concession,
      ConcessionCategory,
      ConcessionOrder,
      ConcessionOrderItem,
    ]),
    AuditModule,
  ],
  controllers: [ConcessionController],
  providers: [ConcessionService],
  exports: [ConcessionService],
})
export class ConcessionModule {}
