import { AttioClient } from '../client';
import { Page, readPage, readRecord } from '../response';

export class WebhookEndpoints {
  constructor(private client: AttioClient) {}

  async listWebhooks(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    return readPage(await this.client.get('/webhooks', params));
  }

  async getWebhook(webhookId: string): Promise<Record<string, unknown>> {
    return readRecord(await this.client.get(`/webhooks/${webhookId}`));
  }

  async createWebhook(data: {
    data: { target_url: string; subscriptions: Array<{ event_type: string }> };
  }): Promise<Record<string, unknown>> {
    return readRecord(await this.client.post('/webhooks', data));
  }

  async updateWebhook(
    webhookId: string,
    data: {
      data: {
        target_url?: string;
        subscriptions?: Array<{ event_type: string }>;
      };
    }
  ): Promise<Record<string, unknown>> {
    return readRecord(await this.client.patch(`/webhooks/${webhookId}`, data));
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/webhooks/${webhookId}`);
  }
}
