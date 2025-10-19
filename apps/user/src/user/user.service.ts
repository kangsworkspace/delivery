import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService
  ){}

  async getUserById(userId: string){
    const user = await this.userRepository.findOneBy({id: userId});

    if(!user){
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto){
    const { email, password } = createUserDto;

    const user = await this.userRepository.findOne({
      where: { email }
    });

    if(user){
      throw new BadRequestException('이미 가입한 이메일입니다.')
    }

    const hashRounds = this.configService.getOrThrow('HASH_ROUNDS');
    const hash = await bcrypt.hash(password, hashRounds);

    await this.userRepository.save({
      ...createUserDto,
      email,
      password: hash,
    });

    return this.userRepository.findOne({
      where: { email },
    });
  }
}
