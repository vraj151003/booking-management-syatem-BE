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
    RoleModule,
    UserModule,
    OtpModule,
    AuthModule,
    PermissionModule,
    ScreenModule,
    MovieModule,
    ShowModule,
    BookingModule
  ],
})
export class AppModule {}