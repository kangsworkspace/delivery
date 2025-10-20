import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    // Redis 방식으로 연결
    transport: Transport.REDIS,
    options: {
        host: 'redis',
        port: 6379,
    }

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
