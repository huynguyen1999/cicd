export interface FileExtension {
  ext: string;
  mime?: string;
}

export interface UploadConfig {
  max_size_in_bytes: number;
  whitelist: FileExtension[];
  blacklist: FileExtension[];
}
