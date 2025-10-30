import { Body, Controller, Post, UnauthorizedException, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-dto';
import { Authorization } from '../../../gateway/src/auth/decorator/authorization.decorator';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ParseBearerTokenDto } from './dto/parse-bearer-dto';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { LoginDto } from './dto/login.dto';
import { UserMicroservice } from '@app/common';

@Controller('auth')
@UserMicroservice.AuthServiceControllerMethods()
export class AuthController implements UserMicroservice.AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  // GRPC 방식으로 연결
  async registerUser(request: UserMicroservice.RegisterUserRequest) {
    const { token } = request;

    if (token === null) {
      throw new UnauthorizedException('토큰을 입력해주세요!');
    }

    const user = await this.authService.register(token, request);
  
    if (!user) {
      throw new RpcException('사용자 생성에 실패했습니다.');
    }

    return user;
  }

  loginUser(request: UserMicroservice.LoginUserRequest) {
    const { token } = request;

    if (token === null) {
      throw new UnauthorizedException('토큰을 입력해주세요!');
    }

    return this.authService.login(token);
  }

  parseBearerToken(request: UserMicroservice.ParseBearerTokenRequest) {
    return this.authService.parseBearerToken(request.token, false);
  }

  // @MessagePattern({
  //   cmd: 'parse_bearer_token'
  // })
  // @UsePipes(ValidationPipe)
  // @UseInterceptors(RpcInterceptor)
  // parseBearerToken(@Payload() payload: ParseBearerTokenDto) {
  //   return this.authService.parseBearerToken(payload.token, false);
  // }

  // @Post('register')
  // @UsePipes(ValidationPipe)
  // registerUser(@Authorization() token: string, @Body() registerDto: RegisterDto) {
  //   if (token === null) {
  //     throw new UnauthorizedException('토큰을 입력해주세요!');
  //   }

  //   return this.authService.register(token, registerDto);
  // }

  // @Post('login')
  // @UsePipes(ValidationPipe)
  // loginUser(@Authorization() token: string) {
  //   if (token === null) {
  //     throw new UnauthorizedException('토큰을 입력해주세요!');
  //   }

  //   return this.authService.login(token);
  // }
}
