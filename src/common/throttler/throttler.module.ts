import { Module } from '@nestjs/common';
import { ThrottlerConfigService } from './throttler.service';
import { CustomThrottlerGuard } from './throttler.guard';
import { User } from '../../module/users/entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../../module/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RedisModule],
  providers: [ThrottlerConfigService, CustomThrottlerGuard],
  exports: [ThrottlerConfigService, CustomThrottlerGuard],
})
export class ThrottlerModule {}
