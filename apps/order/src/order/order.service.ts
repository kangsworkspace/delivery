import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { constructMetadata, PAYMENT_SERVICE, PaymentMicroservice, PRODUCT_SERVICE, ProductMicroservice, USER_SERVICE, UserMicroservice } from '@app/common';
import { PaymentCancelledException } from './exception/payment-cancelled.exception';
import { Product } from './entity/product.entity';
import { AddressDto } from './dto/address.dto';
import { Customer } from './entity/customer.entity';
import { Order, OrderStatus } from './entity/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentDto } from './dto/payment.dto';
import { PaymentFailedException } from './exception/payment-failed-exception';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class OrderService implements OnModuleInit{
  userService: UserMicroservice.UserServiceClient;
  productService: ProductMicroservice.ProductServiceClient;
  paymentService: PaymentMicroservice.PaymentServiceClient;

  constructor(
    // GRPC 방식으로 연결
    @Inject(USER_SERVICE)
    private readonly userMicroservice: ClientGrpc,

    @Inject(PRODUCT_SERVICE)
    private readonly productMicroservice: ClientGrpc,

    @Inject(PAYMENT_SERVICE)
    private readonly paymentMicroservice: ClientGrpc,

    // @Inject(USER_SERVICE)
    // private readonly userService: ClientProxy,

    // @Inject(PRODUCT_SERVICE)
    // private readonly productService: ClientProxy,

    // @Inject(PAYMENT_SERVICE)
    // private readonly paymentService: ClientProxy,

    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>
  ){}
  onModuleInit() {
    this.userService = this.userMicroservice.getService<UserMicroservice.UserServiceClient>(
      'UserService',
    );
    this.productService = this.productMicroservice.getService<ProductMicroservice.ProductServiceClient>(
      'ProductService',
    );
    this.paymentService = this.paymentMicroservice.getService<PaymentMicroservice.PaymentServiceClient>(
      'PaymentService',
    );
  }

  async createOrder(createOrderDto: CreateOrderDto, metadata: Metadata) {
    try {
      const { productIds, address, payment, meta } = createOrderDto;

      /// 1) 사용자 정보 가져오기
      const user = await this.getUserFromToken(meta.user.sub, metadata);

      /// 2) 상품 정보 가져오기
      const products = await this.getProductsByIds(productIds, metadata);

      /// 3) 총 금액 계산하기
      const totalAmount = this.calculateTotalAmount(products);

      /// 4) 금액 검증하기 - total이 맞는지 (프론트에서 보내준 데이터랑)
      this.validatePaymentAmount(totalAmount, payment.amount);

      /// 5) 주문 생성하기
      const customer = this.createCustomer(user);
      const order = await this.createNewOrder(customer, products, address, payment);
      
      /// 6) 결제 시도하기 & 주문 상태 업데이트하기
      await this.processPayment(order._id.toString(), payment, user.email, metadata);

      /// 7) 결과 반환하기
      return this.orderModel.findById(order._id);
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  changeOrderStatus(orderId: string, status: OrderStatus){
    return this.orderModel.findByIdAndUpdate(orderId, { status });
  }

  private async getUserFromToken(userId: string, metadata: Metadata) {
    /// 1) User MS : JWT 토큰 검증
    // const tResp = await lastValueFrom(this.userService.send(
    //   { cmd: 'parse_bearer_token' },
    //   { token }
    // ));

    // if (tResp.status === 'error') {
    //   throw new PaymentCancelledException(tResp);
    // }

    /// 2) User MS : 사용자 정보 가져오기
    // const userId = tResp.data.sub;
    
    // GRPC 방식으로 연결
    const uResp = await lastValueFrom(this.userService.getUserInfo({ userId, },
      constructMetadata(OrderService.name, 'getUserFromToken', metadata))
    );

    return uResp;

    // const uResp = await lastValueFrom(this.userService.send(
    //   { cmd: 'get_user_info' },
    //   { userId }
    // ));

    // if (uResp.status === 'error') {
    //   throw new PaymentCancelledException(uResp);
    // }

    // return uResp.data;
  }

  private async getProductsByIds(productIds: string[], metadata: Metadata): Promise<Product[]>{
    // GRPC 방식으로 연결
    const reps = await lastValueFrom(this.productService.getProductsInfo({
      productIds,
    }, constructMetadata(OrderService.name, 'getProductsByIds', metadata)));

    return reps.products.map((product) => ({
      productId: product.id,
      name: product.name,
      price: product.price,
    }));

    // const resp = await lastValueFrom(this.productService.send(
    //   { cmd: 'get_products_info' },
    //   { productIds }
    // ));

    // if(resp.status === 'error'){
    //   throw new PaymentCancelledException('상품 정보가 잘못됐습니다!');
    // }

    // /// Product Entity로 전환
    // return resp.data.map((product) => ({
    //   productId: product.id,
    //   name: product.name,
    //   price: product.price
    // }));
  }

  private calculateTotalAmount(products: Product[]){
    return products.reduce((acc, next) => acc + next.price, 0);
  }

  private validatePaymentAmount(totalA: number, totalB: number){
    if(totalA !== totalB){
      throw new PaymentCancelledException('결제하려는 금액이 변경됐습니다!');
    }
  }

  private createCustomer(user: {id: string, email: string, name: string}) {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private createNewOrder(customer: Customer, products: Product[], address: AddressDto, payment: PaymentDto){
    return this.orderModel.create({
      customer,
      products,
      deliveryAddress: address,
      payment,
    })
  }

  private async processPayment(orderId: string, payment: PaymentDto, userEmail: string, metadata: Metadata){
    try {
      // GRPC 방식으로 연결
      const resp = await lastValueFrom(this.paymentService.makePayment({
        ...payment,
        userEmail,
        orderId,
      }, constructMetadata(OrderService.name, 'processPayment', metadata)));

      const isPaid = resp.paymentStatus === 'Approved';

      // const resp = await lastValueFrom(this.paymentService.send(
      //   { cmd: 'make_payment' },
      //   { 
      //     ...payment,
      //     userEmail,
      //     orderId,
      //   }
      // ));
  
      // if(resp.status === 'error'){
      //   throw new PaymentFailedException(resp);
      // }
  
      // const isPaid = resp.data.paymentStatus === 'Approved';
      const orderStatus = isPaid ? OrderStatus.paymentProcessed : OrderStatus.paymentFailed;

      if(orderStatus === OrderStatus.paymentFailed){
        throw new PaymentFailedException(resp);
      }

      await this.orderModel.findByIdAndUpdate(orderId, {
        status: OrderStatus.paymentProcessed,
      });

      return resp;
    } catch (error) {
      if(error instanceof PaymentFailedException){
        await this.orderModel.findByIdAndUpdate(orderId, {
          status: OrderStatus.paymentFailed,
        })
      };

      throw error;
    }
  }
}
