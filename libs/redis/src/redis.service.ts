import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { REDIS_OPTIONS } from '../../common/src';
import { IRedisOptions } from './redis.interfaces';
import { createClient } from 'redis';
@Injectable()
export class RedisService implements OnModuleInit {
  private client = createClient(this.redisOptions);
  constructor(@Inject(REDIS_OPTIONS) private redisOptions: IRedisOptions) {}
  async onModuleInit() {
    this.client = await createClient(this.redisOptions)
      .on('error', (err) => console.log(`Redis client error: ${err}`))
      .connect();
    console.log('Redis client connected');
  }
  async get(key: string) {
    return await this.client.get(key);
  }
  async set(key: string, value: string, ttl?: number) {
    return await this.client.set(key, value, { EX: ttl });
  }
  async deleteKey(key: string) {
    return await this.client.del(key);
  }
  async setIfNotExists(key: string, value: string, ttl?: number) {
    return await this.client.set(key, value, { EX: ttl, NX: true });
  }

  async setHash(key: string, field: string, value: string) {
    return await this.client.hSet(key, field, value);
  }
  async getHash(key: string, field: string) {
    return await this.client.hGet(key, field);
  }
  async deleteHash(key: string, field: string) {
    return await this.client.hDel(key, field);
  }
}
