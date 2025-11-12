import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ORDER_SERVICE, OrderMicroservice, PRODUCT_SERVICE, ProductMicroservice, USER_SERVICE, UserMicroservice } from "@app/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from 'joi';
import { BearerTokenMiddleware } from "./auth/middleware/bearer-token.middleware";
import { join } from "path";
import { traceInterceptor } from "@app/common/grpc/interceptor";
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                USER_HOST: Joi.string().required(),
                USER_TCP_PORT: Joi.number().required(),
                PRODUCT_HOST: Joi.string().required(),
                PRODUCT_TCP_PORT: Joi.number().required(),
                ORDER_HOST: Joi.string().required(),
                ORDER_TCP_PORT: Joi.number().required(),
            }),
        }), 
        ClientsModule.registerAsync({
            clients: [
                {
                    name: USER_SERVICE,
                    useFactory: (configService: ConfigService) => ({
                        // GRPC 방식으로 연결
                        transport: Transport.GRPC,
                        options: {
                            channelOptions: {
                                interceptors: [traceInterceptor('Gateway')]
                            },
                            package: UserMicroservice.protobufPackage,
                            protoPath: join(process.cwd(), 'proto/user.proto'),
                            url: configService.getOrThrow('USER_GRPC_URL'),
                        },

                        // RabbitMQ 방식으로 연결
                        // transport: Transport.RMQ,
                        // options: {
                        //     urls: ['amqp://rabbitmq:5672'],
                        //     queue: 'user_queue',
                        //     queueOptions: {
                        //         durable: false,
                        //     }
                        // }

                        // Redis 방식으로 연결
                        // transport: Transport.REDIS,
                        // options: {
                        //     host: 'redis',
                        //     port: 6379,
                        // }

                        // TCP 방식으로 연결
                        // transport: Transport.TCP,
                        // options: {
                        //     host: configService.getOrThrow('USER_HOST'),
                        //     port: configService.getOrThrow('USER_TCP_PORT'),
                        // }
                    }),
                    inject: [ConfigService]
                },
                {
                    name: PRODUCT_SERVICE,
                    useFactory: (configService: ConfigService) => ({
                        // GRPC 방식으로 연결
                        transport: Transport.GRPC,
                        options: {
                            channelOptions: {
                                interceptors: [traceInterceptor('Gateway')]
                            },
                            package: ProductMicroservice.protobufPackage,
                            protoPath: join(process.cwd(), 'proto/product.proto'),
                            url: configService.getOrThrow('PRODUCT_GRPC_URL'),
                        },

                        // RabbitMQ 방식으로 연결
                        // transport: Transport.RMQ,
                        // options: {
                        //     urls: ['amqp://rabbitmq:5672'],
                        //     queue: 'product_queue',
                        //     queueOptions: {
                        //         durable: false,
                        //     }
                        // }

                        // Redis 방식으로 연결
                        // transport: Transport.REDIS,
                        // options: {
                        //     host: 'redis',
                        //     port: 6379,
                        // }

                        // TCP 방식으로 연결
                        // transport: Transport.TCP,
                        // options: {
                        //     host: configService.getOrThrow('PRODUCT_HOST'),
                        //     port: configService.getOrThrow('PRODUCT_TCP_PORT'),
                        // }
                    }),
                    inject: [ConfigService]
                },
                {
                    name: ORDER_SERVICE,
                    useFactory: (configService: ConfigService) => ({
                        // GRPC 방식으로 연결
                        transport: Transport.GRPC,
                        options: {
                            channelOptions: {
                                interceptors: [traceInterceptor('Gateway')]
                            },
                            package: OrderMicroservice.protobufPackage,
                            protoPath: join(process.cwd(), 'proto/order.proto'),
                            url: configService.getOrThrow('ORDER_GRPC_URL'),
                        },

                        // RabbitMQ 방식으로 연결
                        // transport: Transport.RMQ,
                        // options: {
                        //     urls: ['amqp://rabbitmq:5672'],
                        //     queue: 'order_queue',
                        //     queueOptions: {
                        //         durable: false,
                        //     }
                        // }

                        // Redis 방식으로 연결
                        // transport: Transport.REDIS,
                        // options: {
                        //     host: 'redis',
                        //     port: 6379,
                        // }

                        // TCP 방식으로 연결
                        // transport: Transport.TCP,
                        // options: {
                        //     host: configService.getOrThrow('ORDER_HOST'),
                        //     port: configService.getOrThrow('ORDER_TCP_PORT'),
                        // }
                    }),
                    inject: [ConfigService]
                },
            ],
            isGlobal: true,
        }),
        OrderModule,
        ProductModule,
        AuthModule,
        HealthModule
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(BearerTokenMiddleware).forRoutes('order');
    }
}