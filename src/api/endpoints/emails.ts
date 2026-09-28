import { AttioClient } from '../client';
import { Page, readPage } from '../response';

export interface ListEmailsOptions {
  limit?: number;
  cursor?: string;
  linkedObject?: string;
  linkedRecordIds?: string;
  participants?: string;
  domain?: string;
  sentAfter?: string;
  sentBefore?: string;
  excludeAutomatedParticipants?: boolean;
}

export class EmailEndpoints {
  constructor(private client: AttioClient) {}

  async listEmails(options?: ListEmailsOptions): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.linkedObject) params.linked_object = options.linkedObject;
    if (options?.linkedRecordIds) {
      params.linked_record_ids = options.linkedRecordIds;
    }
    if (options?.participants) params.participants = options.participants;
    if (options?.domain) params.domain = options.domain;
    if (options?.sentAfter) params.sent_after = options.sentAfter;
    if (options?.sentBefore) params.sent_before = options.sentBefore;
    if (options?.excludeAutomatedParticipants) {
      params.exclude_automated_participants = true;
    }
    return readPage(await this.client.get('/emails', params));
  }
}
