import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fsPromises, existsSync, mkdirSync } from 'fs';
import * as nsfw from 'nsfwjs';
import { fromBuffer } from 'file-type';
import * as tf from '@tensorflow/tfjs-node';
import { UploadedFileRepository } from '@app/database';
import { NSFWClassName, NSFW_THRESHOLD, UploadedFileStatus } from '@app/common';

@Injectable()
export class NSFWClassifierService implements OnModuleInit {
  constructor(
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}
  private nsfwModel: nsfw.NSFWJS;
  async onModuleInit() {
    this.nsfwModel = await nsfw.load();
  }

  async checkNSFW(filePath: string) {
    const fileBuffer = await fsPromises.readFile(filePath);
    const { mime } = await fromBuffer(fileBuffer);
    // only check for image
    if (mime.split('/')[0] !== 'image') {
      return false;
    }
    // prediction
    const image: any = tf.node.decodeImage(fileBuffer, 3);
    let predictions = await this.nsfwModel.classify(image);
    image.dispose();
    const result = predictions.reduce((acc: any, cur: nsfw.predictionType) => {
      if (cur.className && cur.probability) {
        acc[cur.className.toLowerCase()] = cur.probability;
      }
      if (
        (cur.className === NSFWClassName.Hentai ||
          cur.className === NSFWClassName.Porn) &&
        cur.probability > NSFW_THRESHOLD
      ) {
        acc.is_nsfw = true;
      }
      return acc;
    }, {});

    // update status if is nsfw
    const updateData: any = {
      metadata: {
        nsfw: result,
      },
    };
    if (result.is_nsfw) {
      updateData.status = UploadedFileStatus.Restricted;
      updateData.$push = {
        notes: {
          time: new Date(),
          content: 'This file is restricted due to NSFW content',
        },
      };
    }
    await this.uploadedFileRepository.findOneAndUpdate(
      { path: filePath },
      updateData,
    );

    return result;
  }
}
