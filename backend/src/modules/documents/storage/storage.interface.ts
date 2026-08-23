export interface StorageFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StoredFileResult {
  storagePath: string;
  fileName: string;
  size: number;
}

export interface IStorageService {
  saveFile(file: StorageFile, directoryPrefix: string): Promise<StoredFileResult>;
  getFileStream(storagePath: string): Promise<NodeJS.ReadableStream>;
  deleteFile(storagePath: string): Promise<void>;
  fileExists(storagePath: string): Promise<boolean>;
}
