import { Injectable } from '@nestjs/common';
import { AxiosService } from '@app/axios';
import { ConfigService } from '@nestjs/config';
import { UploadedFileRepository, User, UserRepository } from '@app/database';
import { compare } from 'bcryptjs';

@Injectable()
export class FaceRecognitionService {
  constructor(
    private readonly axiosService: AxiosService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}
  private getRequestUrl(pathName: string) {
    const port = this.configService.get<string>('MODEL_PORT');
    return `http://127.0.0.1:${port}/${pathName}`;
  }
  private async getFilePath(fileName: string) {
    const uploadedFile = await this.uploadedFileRepository.findOne({
      name: fileName,
    });
    if (!uploadedFile) {
      throw new Error('File not found');
    }
    return uploadedFile.path;
  }

  async extractFaceFeatures(fileName: string, user: User) {
    const filePath = await this.getFilePath(fileName);
    const url = this.getRequestUrl('extractFaceFeatures');
    const result = await this.axiosService.request(url, 'POST', {
      path: filePath,
    });
    if (!result.data) {
      throw new Error('No face features found');
    }
    const { data: faceFeatures } = result.data;
    // saving user face features to database
    await this.userRepository.findOneAndUpdate(
      { _id: user._id },
      {
        face_features: {
          path: filePath,
          values: faceFeatures,
        },
      },
    );
  }

  async recognizeFaces(fileName: string, user: User) {
    const filePath = await this.getFilePath(fileName);
    const url = this.getRequestUrl('recognizeFacesWithClassifier');
    const result = await this.axiosService.request(url, 'POST', {
      path: filePath,
    });
    if (!result.data) {
      throw new Error('No face features found');
    }
    const { data: recognitionResult } = result.data;
    const recognizedUsers = [];
    for await (const faceRecognition of recognitionResult) {
      const { name, bounding_box, face_features } = faceRecognition;
      const recognizedUser = await this.userRepository.findOne(
        { _id: name },
        '+face_features',
      );
      if (!recognizedUser) {
        console.log('Recognized user not found');
        continue;
      }
      const compareFaceUrl = this.getRequestUrl('compareFaceToFace');
      const data = {
        target_encoding: recognizedUser.face_features.values,
        source_encoding: face_features,
      };
      const compareResult = await this.axiosService.request(
        compareFaceUrl,
        'POST',
        data,
      );
      if (!compareResult.data) {
        throw new Error('Cannot compare faces');
      }
      const { data: compareData } = compareResult.data;
      if (compareData.is_identical) {
        recognizedUsers.push({
          _id: recognizedUser._id.toString(),
          name: recognizedUser.full_name,
          bounding_box,
        });
      }
    }
    return recognizedUsers;
  }

  async buildFaceClassifier(user: User) {
    const users = await this.userRepository.find(
      {
        face_features: { $ne: null, $exists: true },
      },
      '+face_features',
    );
    if (!users?.length) {
      throw new Error('No users with face features found');
    }
    const data: any = users.reduce((acc, cur) => {
      acc[cur._id.toString()] = [cur.face_features?.path];
      return acc;
    }, {});

    const url = this.getRequestUrl('buildFaceClassifier');
    const result = await this.axiosService.request(url, 'POST', { data });
    return result.data;
  }
}
