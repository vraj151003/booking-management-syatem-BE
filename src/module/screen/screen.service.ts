import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Screen } from './entity/screen.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { CreateScreenDTO } from './dto/create-screen-dto';
import { Seat } from '../seat/entity/seat.entity';
import { UpdateScreenDTO } from './dto/update-screen.dto';
import { SeatType } from '../../common/constant';
import messages from '../../common/config/message.json';

@Injectable()
export class ScreenService {
  constructor(
    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
  ) {}

  async createScreen(dto: CreateScreenDTO) {
    const owner = await this.userRepo.findOne({ where: { id: dto.ownerId } });
    if (!owner) {
      throw new NotFoundException(messages.messages.SCREEN.USER_NOT_FOUND);
    }

    const totalSeats = dto.layout.reduce(
        (sum, row) => sum + row.seats,0
    )
    const screen = this.screenRepo.create({
      name: dto.name,
      totalSeats,
      theaterOwner: owner,
    });

    const savedScreen = await this.screenRepo.save(screen);

    const seats: Seat[] = [];

    for(const rowCobnfig of dto.layout){
        for(let i=1; i <= rowCobnfig.seats; i++){
            seats.push(
                this.seatRepo.create({
                    seatNumber: `${rowCobnfig.row}${i}`,
                    row: rowCobnfig.row,
                    seatType: rowCobnfig.type as SeatType,
                    screen: savedScreen,
                    price: 0,
                })
            )
        }
    }

    await this.seatRepo.save(seats);
    return {
      message: messages.messages.SCREEN.CREATE,
      data: savedScreen,
    };
  }

  async findAllScreen(){
    const screen = await this.screenRepo.find({
        relations : ['theaterOwner']
    })

    return {
        message : messages.messages.SCREEN.GET_ALL,
        data : screen
    }
  }

   async findOne(id: string) {
    const screen = await this.screenRepo.findOne({
      where: { id },
      relations: ['theaterOwner'],
    });

    if (!screen) {
      throw new NotFoundException(messages.messages.SCREEN.NOT_FOUND);
    }

    return {
      message: messages.messages.SCREEN.GET_BY_ID,
      data: screen,
    };
  }

  async updateScreen(id : string, dto : UpdateScreenDTO){
    const screen = await this.screenRepo.findOne({
        where : {id}
    })

    if(!screen){
        throw new NotFoundException(messages.messages.SCREEN.NOT_FOUND)
    }

    Object.assign(screen , dto);
    await this.screenRepo.save(screen);
    return {
        message : messages.messages.SCREEN.UPDATE,
        data : screen
    }
  }

  async deleteScreen(id :string){
    const screen = await this.screenRepo.findOne({
        where : {id}
    })

    if(!screen){
        throw new NotFoundException(messages.messages.SCREEN.NOT_FOUND)
    }

    await this.screenRepo.remove(screen)

    return {
        message : messages.messages.SCREEN.DELETE
    }
  }
}
