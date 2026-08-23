import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageService, StorageFile, StoredFileResult } from './storage.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly baseUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async saveFile(file: StorageFile, directoryPrefix: string): Promise<StoredFileResult> {
    const targetDir = path.join(this.baseUploadDir, directoryPrefix);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalName);
    const sanitizedBase = path
      .basename(file.originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const fileName = `${sanitizedBase}_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
    const fullPath = path.join(targetDir, fileName);

    await fs.promises.writeFile(fullPath, file.buffer);

    const relativePath = path.join(directoryPrefix, fileName);
    return {
      storagePath: relativePath,
      fileName,
      size: file.size,
    };
  }

  async getFileStream(storagePath: string): Promise<NodeJS.ReadableStream> {
    const fullPath = path.join(this.baseUploadDir, storagePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found on storage: ${storagePath}`);
    }
    return fs.createReadStream(fullPath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseUploadDir, storagePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseUploadDir, storagePath);
    return fs.existsSync(fullPath);
  }
}
