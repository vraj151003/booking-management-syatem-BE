import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { v2 as cloudinary } from 'cloudinary';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: 'CLOUDINARY',
      useFactory: (configService: ConfigService) => {
        return cloudinary.config({
          cloud_name: configService.get<string>('database.cloudinary_cloud_name'),
          api_key: configService.get<string>('database.cloudinary_api_key'),
          api_secret: configService.get<string>('database.cloudinary_api_secret'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
