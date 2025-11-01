import { Controller, Get, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { MakePaymentDto } from '../dto/make-payment.dto';
import { GrpcInterceptor, PaymentMicroservice } from '@app/common';
import { PaymentMethod } from '../entity/payment.entity';
import { Metadata } from '@grpc/grpc-js';

@Controller()
@PaymentMicroservice.PaymentServiceControllerMethods()
@UseInterceptors(GrpcInterceptor)
export class PaymentController implements PaymentMicroservice.PaymentServiceController {
  constructor(private readonly paymentService: PaymentService) {}

  // GRPC 방식으로 연결
  async makePayment(request: PaymentMicroservice.MakePaymentRequest, metadata: Metadata) {
    const resp = await this.paymentService.makePayment({
      ...request,
      paymentMethod: request.paymentMethod as PaymentMethod
    }, metadata);

    if (!resp) {
      throw new RpcException('결제 실패');
    }

    return resp;
  }


  // @MessagePattern({cmd: 'make_payment'})
  // @UsePipes(ValidationPipe)
  // @UseInterceptors(RpcInterceptor)
  // async makePayment(@Payload() payload: MakePaymentDto){
  //   return await this.paymentService.makePayment(payload);
  // }
}
