import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { IRedisAsyncOptions, IRedisOptions } from './redis.interfaces';
import { REDIS_OPTIONS } from '../../common/src';

@Global()
@Module({})
export class RedisModule {
  static register(options: IRedisOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [{ provide: REDIS_OPTIONS, useValue: options }, RedisService],
      exports: [RedisService],
    };
  }

  static registerAsync(options: IRedisAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: options.imports,
      providers: [
        {
          provide: REDIS_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
