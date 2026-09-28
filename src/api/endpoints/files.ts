import { readFileSync } from 'fs';
import { basename } from 'path';
import { AttioClient } from '../client';
import { Page, readPage, readRecord } from '../response';

export class FileEndpoints {
  constructor(private client: AttioClient) {}

  async listFiles(options: {
    object: string;
    recordId: string;
    storageProvider?: string;
    parentFolderId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<Page> {
    const params: Record<string, unknown> = {
      object: options.object,
      record_id: options.recordId,
    };
    if (options.storageProvider) {
      params.storage_provider = options.storageProvider;
    }
    if (options.parentFolderId)
      params.parent_folder_id = options.parentFolderId;
    if (options.limit) params.limit = options.limit;
    if (options.cursor) params.cursor = options.cursor;
    return readPage(await this.client.get('/files', params));
  }

  async getFile(fileId: string): Promise<Record<string, unknown>> {
    return readRecord(await this.client.get(`/files/${fileId}`));
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(`/files/${fileId}`);
  }

  async createFile(
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return readRecord(await this.client.post('/files', body));
  }

  async uploadFile(options: {
    filePath: string;
    object: string;
    recordId: string;
    parentFolderId?: string;
  }): Promise<Record<string, unknown>> {
    const bytes = readFileSync(options.filePath);
    const form = new FormData();
    form.append('file', new Blob([bytes]), basename(options.filePath));
    form.append('object', options.object);
    form.append('record_id', options.recordId);
    if (options.parentFolderId) {
      form.append('parent_folder_id', options.parentFolderId);
    }
    return readRecord(await this.client.postForm('/files/upload', form));
  }

  async downloadUrl(fileId: string): Promise<string> {
    return this.client.redirectLocation(`/files/${fileId}/download`);
  }
}
