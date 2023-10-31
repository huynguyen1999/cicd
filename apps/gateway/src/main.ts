import {
  ActivityTrackerInterceptor,
  LoggingInterceptor,
  ResponseInterceptor,
} from '@app/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SocketIoAdapter } from './adapters';
import { RabbitmqService } from '@app/rabbitmq';
import { RedisService } from '@app/redis';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './filters';
import * as cookieParser from 'cookie-parser';
import * as os from 'os';
import * as nodeCluster from 'cluster';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule, {
    cors: true,
  });
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '10mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const configService = app.get(ConfigService);
  const rmqService = app.get(RabbitmqService);
  const redisService = app.get(RedisService);
  const reflector = app.get(Reflector);
  const port = configService.get('PORT');
  const redisSocketIoAdapter = new SocketIoAdapter(
    app,
    configService,
    rmqService,
    redisService,
  );
  await redisSocketIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisSocketIoAdapter);
  app.useGlobalInterceptors(
    new ActivityTrackerInterceptor(reflector, redisService),
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(port, () => {
    console.log(
      `API Gateway service is running on port ${port}, in process ${process.pid}`,
    );
  });
}
bootstrap();

// test programming on multiple cores using cluster package
const cluster = nodeCluster as any as nodeCluster.Cluster;
function clusterize(callback: Function) {
  const numCPUs = os.cpus().length / 2;
  if (cluster.isPrimary) {
    console.log(`MASTER SERVER (${process.pid}) IS RUNNING `);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    callback();
  }
}

// if (process.versions.bun) {
//   bootstrap();
// } else {
//   clusterize(bootstrap);
// }
