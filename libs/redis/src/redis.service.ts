import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { REDIS_OPTIONS } from '../../common/src';
import { IRedisOptions } from './redis.interfaces';
import { SetOptions, createClient } from 'redis';
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
    const rawData = await this.client.get(key);
    try {
      return JSON.parse(rawData);
    } catch (exception) {
      return rawData;
    }
  }

  async getMultiple(keys: string[]) {
    const rawData = await this.client.mGet(keys);
    const data = rawData.map((rawItem) => {
      if (!rawItem) return null;
      try {
        return JSON.parse(rawItem);
      } catch (exception) {
        return rawItem;
      }
    });
    return data;
  }
  async getDuration(key: string) {
    return await this.client.pTTL(key);
  }

  async getByPattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (!keys?.length) {
      return null;
    }
    const result = await this.getMultiple(keys);
    return result;
  }

  async set(key: string, value: any, options?: SetOptions) {
    // console.log(`setting ${key} with options ${JSON.stringify(options)} with value ${JSON.stringify(value)}`);
    return await this.client.set(key, JSON.stringify(value), options);
  }

  async deleteKey(key: string) {
    return await this.client.del(key);
  }

  async setExpiration(key: string, ttl: number) {
    return await this.client.pExpire(key, ttl);
  }

  async unlink(key: string | string[]) {
    return await this.client.unlink(key);
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
    if (!scanResult.keys?.length) return null;
    return await this.client.unlink(scanResult.keys || []);
  }
}
