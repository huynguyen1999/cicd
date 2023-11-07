import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { ConfigService } from '@nestjs/config';
import {
  LoggingInterceptor,
  MicroserviceFilter,
  ResponseInterceptor,
} from '@app/common';
import { spawn } from 'node:child_process';
import * as path from 'path';

const spawnAnalyzerModel = (modelPort: string) => {
  const command = spawn('python3', [
    path.join(__dirname, 'model', 'model.py'),
    modelPort,
    path.join(__dirname, 'model', 'toxicity.h5'),
    path.join(__dirname, 'model', 'train.csv'),
  ]);
  command.stdout.on('data', (data) => {
    console.log('Analyzer model log: ', data.toString());
  });
  command.stderr.on('data', (data) => {
    console.log('Analyzer model log: ', data.toString());
  });
  command.on('close', (code) => {
    console.log(`Child closed with code ${code}`);
  });
  command.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AiModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const modelPort = configService.get('MODEL_PORT');
  spawnAnalyzerModel(modelPort);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new MicroserviceFilter());
  await app.listen(port, () => {
    let runtime = process.versions.bun ? 'bun' : 'node';
    console.log(`AI service is running on port ${port} in ${runtime} runtime`);
  });
}
bootstrap();
