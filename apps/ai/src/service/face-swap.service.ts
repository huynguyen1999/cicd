import { Injectable } from '@nestjs/common';
import { FaceSwapDto } from '@app/common';
import { spawn } from 'node:child_process';
import { UploadedFileRepository, UserRepository } from '@app/database';
import { String } from 'aws-sdk/clients/appstream';
import { RpcException } from '@nestjs/microservices';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import { existsSync } from 'node:fs';

@Injectable()
export class FaceSwapService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}

  async requestFaceSwapFromRoop(
    sourcePath: string,
    targetPath: string,
    outputPath: string,
  ) {
    console.log(outputPath);
    return new Promise((resolve, reject) => {
      const command = spawn(
        'python',
        [
          'run.py',
          `--source`,
          sourcePath,
          `--target`,
          targetPath,
          `--output`,
          outputPath,
        ],
        { cwd: '/Users/admin/Source/DataScience/roop' },
      );
      command.stdout.on('data', (data) => console.log(data.toString()));
      command.stdout.on('error', (err) => console.log(err.toString()));
      command.on('close', (code) => resolve(code));
      command.on('exit', (code) => resolve(code));
    });
  }

  async execute(data: FaceSwapDto) {
    const { files, users } = data;
    let sourceFilePath: string, targetFilePath: String;
    if (users) {
      const { source, target } = users;
      const [sourceUser, targetUser] = await Promise.all([
        this.userRepository.findOne(
          { _id: source },
          { profile_picture: 1, face_features: 1 },
        ),
        this.userRepository.findOne(
          { _id: target },
          { profile_picture: 1, face_features: 1 },
        ),
      ]);

      if (sourceUser.face_features?.path === sourceUser.profile_picture) {
        sourceFilePath = sourceUser.profile_picture;
      }
      if (targetUser.face_features?.path === targetUser.profile_picture) {
        targetFilePath = targetUser.profile_picture;
      }
    } else if (files) {
      const { source, target } = files;
      const [sourceFile, targetFile] = await Promise.all([
        this.uploadedFileRepository.findOne({ name: source }),
        this.uploadedFileRepository.findOne({ name: target }),
      ]);

      if (sourceFile) {
        sourceFilePath = sourceFile.path;
      }
      if (targetFile) {
        targetFilePath = targetFile.path;
      }
    }

    if (!sourceFilePath || !targetFilePath) {
      throw new RpcException('Source or target file not found');
    }
    const outputMime = targetFilePath.split('.').pop();
    const outputPath = join(
      __dirname,
      '../../../public/other',
      `face_swap_${Date.now()}.${outputMime}`,
    );
    await this.requestFaceSwapFromRoop(
      sourceFilePath,
      targetFilePath,
      outputPath,
    );

    if (!existsSync(outputPath)) {
      throw new RpcException('Face swap failed');
    }
    return outputPath;
  }
}
