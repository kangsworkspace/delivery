import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from '../entity/payment.entity';
import { Repository } from 'typeorm';
import { MakePaymentDto } from '../dto/make-payment.dto';
import { NOTIFICATION_SERVICE } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: ClientProxy

  ){}


  async makePayment(payload: MakePaymentDto) {
    let paymentId: string = '';

    try {
      const result = await this.paymentRepository.save(payload);
      paymentId = result.id;

      await this.processPayment();

      await this.updatePaymentStatus(result.id, PaymentStatus.approved);

      /// TODO: notification 보내기
      this.sendNotification(payload.orderId, payload.userEmail);

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

  async sendNotification(orderId: string, to: string){
    const resp = await lastValueFrom(this.notificationService.send(
      { cmd: 'send_payment_notification' },
      { to, orderId }
    ));
  }
}
