import { FileExtension, UploadConfig } from '../interfaces';

export enum UploadType {
  Avatar = 'avatar',
  MessageMedia = 'message-media',
  Other = 'other', // will be cleared after a while
}

export const FILE_EXTENSIONS: Record<string, FileExtension> = {
  PNG: {
    ext: 'png',
    mime: 'image/png',
  },
  JPG: {
    ext: 'jpg',
    mime: 'image/jpg',
  },
  JPEG: {
    ext: 'jpeg',
    mime: 'image/jpeg',
  },
  GIF: {
    ext: 'gif',
    mime: 'image/gif',
  },
  ZIP: {
    ext: 'zip',
    mime: 'application/zip',
  },
  SEVEN_ZIP: {
    ext: '7z',
    mime: 'application/x-7z-compressed',
  },
  RAR: {
    ext: 'rar',
    mime: 'application/vnd.rar',
  },
  BZ: {
    ext: 'bz',
    mime: 'application/x-bzip',
  },
  BZ2: {
    ext: 'bz2',
    mime: 'application/x-bzip2',
  },
  EXE: {
    ext: 'exe',
  },
  ISO: {
    ext: 'iso',
  },
  XZ: {
    ext: 'xz',
  },
  GZ: {
    ext: 'gz',
  },
  Z: {
    ext: 'z',
  },
  MP3: {
    ext: 'mp3',
    mime: 'audio/mpeg',
  },
  WAV: {
    ext: 'wav',
    mime: 'audio/wav',
  },
};

export const TYPE_UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  [UploadType.Avatar]: {
    max_size_in_bytes: 1024 * 1024 * 5, // 5MB
    whitelist: [
      FILE_EXTENSIONS.GIF,
      FILE_EXTENSIONS.JPG,
      FILE_EXTENSIONS.PNG,
      FILE_EXTENSIONS.JPEG,
    ],
    blacklist: [],
  },
  [UploadType.MessageMedia]: {
    max_size_in_bytes: 1024 * 1024 * 50, // 50MB
    whitelist: [],
    blacklist: [
      FILE_EXTENSIONS.EXE,
      FILE_EXTENSIONS.ISO,
      FILE_EXTENSIONS.BZ,
      FILE_EXTENSIONS.BZ2,
      FILE_EXTENSIONS.RAR,
      FILE_EXTENSIONS.SEVEN_ZIP,
      FILE_EXTENSIONS.ZIP,
      FILE_EXTENSIONS.XZ,
      FILE_EXTENSIONS.GZ,
      FILE_EXTENSIONS.Z,
    ],
  },
  [UploadType.Other]: {
    max_size_in_bytes: 1024 * 1024 * 50,
    whitelist: [],
    blacklist: [
      FILE_EXTENSIONS.EXE,
      FILE_EXTENSIONS.ISO,
      FILE_EXTENSIONS.BZ,
      FILE_EXTENSIONS.BZ2,
      FILE_EXTENSIONS.RAR,
      FILE_EXTENSIONS.SEVEN_ZIP,
      FILE_EXTENSIONS.ZIP,
      FILE_EXTENSIONS.XZ,
      FILE_EXTENSIONS.GZ,
      FILE_EXTENSIONS.Z,
    ],
  },
};
