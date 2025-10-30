import { Controller, Get, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { GetUserInfoDto } from './dto/get-user-info.dto';
import { UserMicroservice } from '@app/common';

@Controller()
@UserMicroservice.UserServiceControllerMethods()
export class UserController implements UserMicroservice.UserServiceController {
  constructor(private readonly userService: UserService) {}

  // GRPC 방식으로 연결
  getUserInfo(request: UserMicroservice.GetUserInfoRequest){
    return this.userService.getUserById(request.userId)
  }

  // @MessagePattern({cmd: 'get_user_info'})
  // @UsePipes(ValidationPipe)
  // @UseInterceptors(RpcInterceptor)
  // getUserInfo(@Payload() data: GetUserInfoDto){
  //   return this.userService.getUserById(data.userId)
  // }
}
