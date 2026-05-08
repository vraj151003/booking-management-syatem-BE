import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { NotificationService } from './notification.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [MailModule, FirebaseModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
