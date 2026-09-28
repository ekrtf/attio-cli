import { AttioClient } from '../client';
import { Page, readPage, readRecord } from '../response';

export class ThreadEndpoints {
  constructor(private client: AttioClient) {}

  async listThreads(options?: {
    recordId?: string;
    object?: string;
    entryId?: string;
    list?: string;
    limit?: number;
    offset?: number;
  }): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.recordId) params.record_id = options.recordId;
    if (options?.object) params.object = options.object;
    if (options?.entryId) params.entry_id = options.entryId;
    if (options?.list) params.list = options.list;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    return readPage(await this.client.get('/threads', params));
  }

  async getThread(
    threadId: string,
    options?: { limit?: number; cursor?: string; createdAfter?: string }
  ): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.createdAfter) params.created_after = options.createdAfter;
    return readRecord(await this.client.get(`/threads/${threadId}`, params));
  }
}
