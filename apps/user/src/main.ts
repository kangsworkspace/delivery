import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserMicroservice } from '@app/common';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    // GRPC 방식으로 연결
    transport: Transport.GRPC,
    options: {
      package: UserMicroservice.protobufPackage,
      protoPath: join(process.cwd(), 'proto/user.proto'),
      url: configService.getOrThrow('GRPC_URL'),
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
    //   host: '0.0.0.0',
    //   port: parseInt(process.env.TCP_PORT || '3001'),
    // },
  });

  await app.startAllMicroservices();
}
bootstrap();
