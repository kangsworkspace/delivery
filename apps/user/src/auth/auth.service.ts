import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register-dto';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService
    ){}

    async register(rawToken: string, registerDto: RegisterDto){
        const { email, password } = this.parseBasicToken(rawToken);
        return this.userService.create({
            ...registerDto,
            email,
            password,
        });
    }
    
    async login(rawToken: string){
        const { email, password } = this.parseBasicToken(rawToken);
        const user = await this.authenticate(email, password);

        return {
            refreshToken: await this.issueToken(user, true),
            accessToken: await this.issueToken(user, false)
        };
    }

    async issueToken(user: any, isRefreshToken: boolean){
        const refreshTokenSecret = this.configService.getOrThrow('REFRESH_TOKEN_SECRET');
        const accessTokenSecret = this.configService.getOrThrow('ACCESS_TOKEN_SECRET');

        return this.jwtService.signAsync({
            sub: user.id ?? user.sub,
            role: user.role,
            type: isRefreshToken ? 'refresh' : 'access',
        }, {
            secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
            expiresIn: isRefreshToken ? '3600h' : '3600h',
        });
    }

    async authenticate(email: string, password: string){
        const user = await this.userRepository.findOne({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
            }
        });

        if(!user){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        const passOk = await bcrypt.compare(password, user.password);

        if(!passOk){
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        return user;
    }

    parseBasicToken(rawToken: string){
        /// Bearer $token
        const basicSplit = rawToken.split(' ');

        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const [basic, token] = basicSplit;

        if(basic.toLowerCase() !== 'basic'){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const decoded = Buffer.from(token, 'base64').toString('utf-8');

        /// username:password
        const tokenSplit = decoded.split(':');

        if(tokenSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const [email, password] = tokenSplit;

        return { email, password };
    }

    async parseBearerToken(rawToken: string, isRefreshToken: boolean){
        console.log('parseBearerToken called with:', { rawToken, isRefreshToken });
        
        if (!rawToken) {
            throw new BadRequestException('토큰이 없습니다!');
        }

        const basicSplit = rawToken.split(' ');

        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const [basic, token] = basicSplit;

        if(basic.toLowerCase() !== 'bearer'){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.configService.getOrThrow(
                        isRefreshToken ? 'REFRESH_TOKEN_SECRET' : 'ACCESS_TOKEN_SECRET'
                    )
                }
            )

            if(isRefreshToken) {
                if(payload.type !== 'refresh'){
                    throw new BadRequestException('Refresh 토큰을 입력해주세요!');
                }
            } else {
                if(payload.type !== 'access'){
                    throw new BadRequestException('Access 토큰을 입력해주세요!');
                }
            }

            return payload;
        } catch (error) {
            console.error('JWT verification error:', error);
            throw new UnauthorizedException('토큰이 만료됐습니다!');
        }
    }
}
