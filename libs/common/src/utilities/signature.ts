import { User } from '@app/database';
import { BadRequestException } from '@nestjs/common';
import * as Crypto from 'crypto';

interface IPayload {
  service: string;
  data?: any;
  user?: Partial<User>;
  timestamp: number;
}

const createSignedData = (payload: IPayload) => {
  const { user, service, timestamp, data } = payload;
  const signedData =
    service +
    timestamp.toString() +
    (data ? JSON.stringify(data) : '') +
    (user ? JSON.stringify(user) : '');
  return signedData;
};

export const generateSignature = (privateKey: string, payload: IPayload) => {
  try {
    const signedData = createSignedData(payload);
    const signature = Crypto.sign(
      'SHA256',
      Buffer.from(signedData),
      privateKey,
    );
    return signature.toString('base64');
  } catch (exception) {
    throw new Error(
      'Error while generating signature: ' + JSON.stringify(exception),
    );
  }
};

export const verifySignature = (
  publicKey: string,
  payload: IPayload,
  signature: string,
) => {
  try {
    const signedData = createSignedData(payload);
    const isVerified = Crypto.verify(
      'SHA256',
      Buffer.from(signedData),
      publicKey,
      Buffer.from(signature, 'base64'),
    );
    return isVerified;
  } catch (exception) {
    throw new Error(
      'Error while verifying signature: ' + JSON.stringify(exception),
    );
  }
};

export const generateKeyPairSync = (modulusLength: number = 512) => {
  const { privateKey, publicKey } = Crypto.generateKeyPairSync('rsa', {
    modulusLength, // The length of the key in bits
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  return { privateKey, publicKey };
};
