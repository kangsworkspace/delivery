import { Controller, Get, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { NotificationMicroservice, RpcInterceptor } from '@app/common';
import { SendPaymentNotificationDto } from './dto/send-payment-notification.dto';

@Controller()
@NotificationMicroservice.NotificationServiceControllerMethods()
export class NotificationController implements NotificationMicroservice.NotificationServiceController {
  constructor(private readonly notificationService: NotificationService) {}

  async sendPaymentNotification(request: SendPaymentNotificationDto){
    const resp = (await this.notificationService.sendPaymentNotification(request))?.toJSON();

    if (!resp) {
      throw new RpcException('Notification 전송 실패');
    }

    return {
      ...resp,
      status: resp.status.toString(),
    }
  }

  // @MessagePattern({ cmd: 'send_payment_notification' })
  // @UsePipes(ValidationPipe)
  // @UseInterceptors(RpcInterceptor)
  // async sendPaymentNotification(@Payload() payload: SendPaymentNotificationDto){
  //   return await this.notificationService.sendPaymentNotification(payload);
  // }
}
