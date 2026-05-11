import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from './module/role/role.module';
import { UserModule } from './module/users/user.module';
import { OtpModule } from './module/otp/otp.module';
import { AuthModule } from './module/auth/auth.module';
import { PermissionModule } from './module/permission/permission.module';
import { ScreenModule } from './module/screen/screen.module';
import { MovieModule } from './module/movie/movie.module';
import { ShowModule } from './module/show/show.module';
import databaseConfig from './common/config/databaseConfig';
import { BookingModule } from './module/booking/booking.module';
import { PaymentModule } from './module/payment/payment.module';
import { NotificationModule } from './module/notification/notification.module';
import { CouponModule } from './module/coupon/coupon.module';
import { FavoriteModule } from './module/favorite/favorite.module';
import { ReviewModule } from './module/review/review.module';
import { MediaModule } from './module/media/media.module';
import { HolidayModule } from './module/holiday/holiday.module';
import { PricingModule } from './module/pricing/pricing.module';
import { TheaterAnalyticsModule } from './module/theater-analytics/theater-analytics.module';
import { ConcessionModule } from './module/concession/concession.module';
import { AuditModule } from './module/audit/audit.module';
import { RecommendationModule } from './module/recommendation/recommendation.module';
import { ThrottlerModule } from './common/throttler/throttler.module';
import { RedisModule } from './module/redis/redis.module';
import { SeatLockModule } from './module/seat-lock/seat-lock.module';
import { ChatbotModule } from './module/chatbot/chatbot.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/throttler/throttler.guard';
import { AuditInterceptor } from './module/audit/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<'postgres'>('database.type'),
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: configService.get<boolean>('database.autoLoadEntities'),
        synchronize: configService.get<boolean>('database.synchronize'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    ConcessionModule,
    AuditModule,
    ThrottlerModule,
    RoleModule,
    UserModule,
    OtpModule,
    AuthModule,
    PermissionModule,
    ScreenModule,
    MovieModule,
    ShowModule,
    BookingModule,
    PaymentModule,
    NotificationModule,
    CouponModule,
    FavoriteModule,
    ReviewModule,
    MediaModule,
    HolidayModule,
    PricingModule,
    TheaterAnalyticsModule,
    RecommendationModule,
    SeatLockModule,
    ChatbotModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}