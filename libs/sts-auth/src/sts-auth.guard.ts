import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { join } from 'path';
import * as FileSystem from 'fs';
import { verifySignature } from '../../common/src';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class StsAuthGuard implements CanActivate, OnModuleInit {
  private publicKeys: Record<string, string> = {};

  async onModuleInit() {
    const publicKeyFolder = join(__dirname, '../../../', 'public/keys');
    const dir = await FileSystem.promises.opendir(publicKeyFolder);
    for await (const file of dir) {
      const serviceName = file.name.split('.')?.[0];
      if (!serviceName) {
        continue;
      }
      const filePath = join(publicKeyFolder, file.name);
      const publicKey = FileSystem.readFileSync(filePath, { encoding: 'utf8' });
      this.publicKeys[serviceName] = publicKey;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws' || context.getType() === 'http') {
      throw new RpcException('Only for microservice authentication');
    }
    const rpcData = context.switchToRpc().getData();
    const { service } = rpcData;
    if (!service) {
      throw new RpcException('Service not found');
    }
    const publicKey = this.publicKeys[service];
    if (!publicKey) {
      throw new RpcException('Public key not found');
    }
    const { signature, ...payload } = rpcData;
    const isVerified = verifySignature(publicKey, payload, signature);
    return isVerified;
  }
}
