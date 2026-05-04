import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concession } from './entity/concession.entity';
import { ConcessionCategory } from './entity/concession-category.entity';
import { ConcessionOrder } from './entity/concession-order.entity';
import { ConcessionOrderItem } from './entity/concession-order-item.entity';
import { ConcessionController } from './concession.controller';
import { ConcessionService } from './concession.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Concession,
      ConcessionCategory,
      ConcessionOrder,
      ConcessionOrderItem,
    ]),
  ],
  controllers: [ConcessionController],
  providers: [ConcessionService],
  exports: [ConcessionService],
})
export class ConcessionModule {}
