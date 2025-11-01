import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from '../entity/payment.entity';
import { Repository } from 'typeorm';
import { MakePaymentDto } from '../dto/make-payment.dto';
import { constructMetadata, NOTIFICATION_SERVICE, NotificationMicroservice } from '@app/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class PaymentService implements OnModuleInit{
  notificationService: NotificationMicroservice.NotificationServiceClient;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    // GRPC 방식으로 연결
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationMicroservice: ClientGrpc

    // RabbitMQ 방식으로 연결
    // @Inject(NOTIFICATION_SERVICE)
    // private readonly notificationService: ClientProxy

  ){}
  onModuleInit() {
    this.notificationService = this.notificationMicroservice.getService<NotificationMicroservice.NotificationServiceClient>(
      'NotificationService',
    );
  }


  async makePayment(payload: MakePaymentDto, metadata: Metadata) {
    let paymentId: string = '';

    try {
      const result = await this.paymentRepository.save(payload);
      paymentId = result.id;

      await this.processPayment();

      await this.updatePaymentStatus(result.id, PaymentStatus.approved);

      /// TODO: notification 보내기
      this.sendNotification(payload.orderId, payload.userEmail, metadata);

      return await this.paymentRepository.findOneBy({ id: result.id })
      
    } catch (error) {
      await this.updatePaymentStatus(paymentId, PaymentStatus.rejected);

      throw error;
    }
  }

  async processPayment(){
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async updatePaymentStatus(id: string, status: PaymentStatus){
    await this.paymentRepository.update(
      { id },
      { paymentStatus: status }
    );
  }

  async sendNotification(orderId: string, to: string, metadata: Metadata){
    // GRPC 방식으로 연결
    const resp = await lastValueFrom(this.notificationService.sendPaymentNotification({
      to,
      orderId
    }, constructMetadata(PaymentService.name, 'sendNotification', metadata)));

    // const resp = await lastValueFrom(this.notificationService.send(
    //   { cmd: 'send_payment_notification' },
    //   { to, orderId }
    // ));
  }
}
