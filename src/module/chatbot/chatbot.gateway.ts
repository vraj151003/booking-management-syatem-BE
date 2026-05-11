import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MovieService } from '../movie/movie.service';
import { ShowService } from '../show/show.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chatbot',
})
export class ChatbotGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly movieService: MovieService,
    private readonly showService: ShowService,
  ) {}

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string },
  ) {
    const query = String(payload.text || '').toLowerCase();
    
    // 1. Greetings & Casual Conversation
    if (this.matches(query, ['hello', 'hi', 'hey', 'greetings', 'morning', 'evening', 'afternoon'])) {
      const greetings = [
        "Hello! 👋 How can I help you with your movie booking today?",
        "Hi there! 🎬 Need help booking tickets or checking movies?",
        "Welcome! 🍿 How may I assist you today?",
        "Hey! Looking for a great movie? I can help you find shows and book seats!"
      ];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      return this.reply(client, randomGreeting);
    }

    if (this.matches(query, ['how are you', 'who are you', 'what can you do'])) {
      return this.reply(client, "I’m your movie booking assistant 🍿 I can help you book tickets, check movie timings, select seats, and answer booking-related questions.");
    }

    // 2. Movie List & Info
    if (this.matches(query, ['movies', 'playing', 'list', 'showing'])) {
      try {
        const movies = await this.movieService.findAllMovies();
        const movieList = movies.data.map(m => `🎬 ${m.name}`).join('\n');
        return this.reply(client, `Currently showing:\n${movieList}\n\nAsk for "info on [movie name]" for more details!`);
      } catch (e) { return this.reply(client, "Sorry, I couldn’t find that information right now."); }
    }

    if (query.includes('info on')) {
      const movieName = query.split('info on')[1].replace(/[?|!|.|,]/g, '').trim();
      try {
        const movies = await this.movieService.findAllMovies();
        const movie = movies.data.find(m => m.name.toLowerCase().includes(movieName));
        if (movie) {
          return this.reply(client, `📍 ${movie.name}\n📝 ${movie.description}\n⭐ Rating: ${movie.rating || 'N/A'}\n🎭 Genre: ${movie.genre}\n🕒 Duration: ${movie.duration} mins`);
        }
        return this.reply(client, `I couldn't find any movie named "${movieName}".`);
      } catch (e) { return this.reply(client, "Sorry, I couldn’t find that information right now."); }
    }

    // 3. Showtimes & Pricing
    if (this.matches(query, ['theater', 'where', 'time', 'price', 'rate', 'ticket', 'cost'])) {
      const movieName = query.replace(/where|theater|time|price|rate|ticket|cost|can i watch|place|location|[?|!|.|,]/g, '').trim();
      try {
        const shows = await this.showService.findAll();
        const movieShows = shows.data.filter(s => s.movie.name.toLowerCase().includes(movieName));
        if (movieShows.length > 0) {
          let response = `🎬 **${movieShows[0].movie.name}** Showtimes & Rates:\n`;
          
          movieShows.forEach(s => {
            const theater = s.screen?.theaterOwner ? `${s.screen.theaterOwner.firstName} ${s.screen.theaterOwner.lastName}` : (s.screen?.name || 'Main Theater');
            const screen = s.screen?.name || 'Standard Screen';
            
            response += `\n🏢 **${theater}** (${screen})`;
            response += `\n🕒 Time: ${s.startTime}`;
            
            // Format pricing
            if (s.pricing) {
              const rates = Object.entries(s.pricing)
                .map(([type, price]) => `${type}: ₹${price}`)
                .join(' | ');
              response += `\n💰 Rates: ${rates}\n`;
            }
          });
          
          return this.reply(client, response);
        }
        return this.reply(client, `I don't see any active shows for "${movieName}" right now.`);
      } catch (e) { 
        console.error(e);
        return this.reply(client, "Sorry, I couldn’t find that information right now."); 
      }
    }

    // 4. Seat Booking Guidance
    if (this.matches(query, ['seat', 'book', 'how to book', 'select'])) {
      return this.reply(client, "💺 **How to book seats:**\n1. Pick your movie and theater.\n2. Click on the seats you want (Grey = Available).\n3. Your selection will turn Yellow.\n4. Click 'Confirm' to proceed to payment.\nNote: Seats are locked for 10 minutes while you pay!");
    }

    // 5. Ticket Cancellation Policies
    if (this.matches(query, ['cancel', 'refund', 'cancellation'])) {
      return this.reply(client, "🎫 **Cancellation Policy:**\n- Cancellations are allowed up to **2 hours** before the showtime.\n- A 10% handling fee applies.\n- Refunds take 5-7 business days to reflect in your account.\n- Discounted tickets (coupons) are non-refundable.");
    }

    // 6. Payment Related Help
    if (this.matches(query, ['payment', 'pay', 'stripe', 'card', 'gst'])) {
      return this.reply(client, "💳 **Payment Information:**\n- We accept all major Credit/Debit cards via **Stripe**.\n- GST (12% or 18%) is calculated automatically at checkout.\n- If a payment fails, your bank usually reverses it within 24 hours.\n- You will receive a real-time notification once payment is successful!");
    }

    // 7. General Support Queries
    if (this.matches(query, ['support', 'help', 'contact', 'email', 'phone'])) {
      return this.reply(client, "🛠 **Need Support?**\n📧 Email: support@moviebooking.com\n📞 Phone: +1-800-MOVIES\n🕒 Hours: 9 AM - 9 PM daily.\nPlease provide your Booking ID for faster assistance!");
    }

    // Default Fallback
    this.reply(client, "Sorry, I couldn’t find that information right now.");
  }

  private matches(query: string, keywords: string[]): boolean {
    return keywords.some(k => query.includes(k));
  }

  private reply(client: Socket, text: string) {
    client.emit('reply', { text });
  }
}
