import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { REDIS_OPTIONS } from '../../common/src';
import { IRedisOptions } from './redis.interfaces';
import { createClient } from 'redis';
@Injectable()
export class RedisService {
  private client = createClient(this.redisOptions);
  constructor(@Inject(REDIS_OPTIONS) private redisOptions: IRedisOptions) {
    (async () => {
      try {
        this.client = createClient(this.redisOptions);
        await this.client.connect();
        console.log('Redis client connected');
      } catch (exception) {
        console.log(
          'Redis client connection failed',
          JSON.stringify(exception),
        );
      }
    })();
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

  async unlink(key: string | string[]) {
    return await this.client.unlink(key);
  }
  async setIfNotExists(key: string, value: string, ttl?: number) {
    return await this.client.set(key, value, { EX: ttl, NX: true });
  }

  async setHash(key: string, field: string, value: string) {
    return await this.client.hSet(key, field, value);
  }
  async getHashAll(key: string) {
    const result = await this.client.hGetAll(key);
    return JSON.parse(JSON.stringify(result));
  }
  async getHash(key: string, field: string) {
    return await this.client.hGet(key, field);
  }
  async deleteHash(key: string, field: string | string[]) {
    return await this.client.hDel(key, field);
  }
  async deleteMultipleKeys(pattern: string) {
    const scanResult = await this.client.scan(0, { MATCH: pattern });
    if (!scanResult.keys?.length) return;
    return await this.client.unlink(scanResult.keys || []);
  }
}
