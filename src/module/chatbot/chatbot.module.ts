import { Module } from '@nestjs/common';
import { ChatbotGateway } from './chatbot.gateway';
import { MovieModule } from '../movie/movie.module';
import { ShowModule } from '../show/show.module';

@Module({
  imports: [MovieModule, ShowModule],
  providers: [ChatbotGateway],
})
export class ChatbotModule {}
