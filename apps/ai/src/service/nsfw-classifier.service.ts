import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fsPromises, existsSync, mkdirSync } from 'fs';
import { fromBuffer } from 'file-type';
import { UploadedFileRepository } from '@app/database';
import { NSFWClassName, NSFW_THRESHOLD, UploadedFileStatus } from '@app/common';
import * as nsfw from 'nsfwjs';
import * as tf from '@tensorflow/tfjs-node';
import * as FileSystem from 'fs';
@Injectable()
export class NSFWClassifierService implements OnModuleInit {
  constructor(
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}
  private nsfwModel: nsfw.NSFWJS;
  async onModuleInit() {
    this.nsfwModel = await nsfw.load();
  }

  async checkNSFW(fileName: string) {
    const file = await this.uploadedFileRepository.findOne({
      name: fileName,
      is_deleted: false,
      status: UploadedFileStatus.Active,
    });
    if (!file || !FileSystem.existsSync(file.path)) {
      throw new Error('File not found');
    }

    const fileBuffer = await fsPromises.readFile(file.path);
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
      { name: file.name },
      updateData,
    );

    return result;
  }
}
