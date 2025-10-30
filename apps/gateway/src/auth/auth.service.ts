import { USER_SERVICE, UserMicroservice } from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
    authService: UserMicroservice.AuthServiceClient;
    
    constructor(
        // GRPC 방식으로 연결
        @Inject(USER_SERVICE)
        private readonly userMicroserfice: ClientGrpc,

        // @Inject(USER_SERVICE)
        // private readonly userMicroserfice: ClientProxy,
    ){}
    onModuleInit() {
        this.authService = this.userMicroserfice.getService<UserMicroservice.AuthServiceClient>(
            'AuthService',
        );
    }

    register(token: string, registerDto: RegisterDto) {
        // GRPC 방식으로 연결
        return this.authService.registerUser({
            ...registerDto,
            token,
        });

        // return lastValueFrom(this.userMicroserfice.send(
        //     { cmd: 'register' },
        //     {
        //         ...registerDto,
        //         token,
        //     }
        // ))
    }

    login(token: string) {
        // GRPC 방식으로 연결
        return this.authService.loginUser({
            token,
        });

        // return lastValueFrom(this.userMicroserfice.send(
        //     { cmd: 'login' },
        //     {
        //         token,
        //     }
        // ))
    }
}
