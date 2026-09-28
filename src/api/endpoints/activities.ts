import { AttioClient } from '../client';
import { Page, readPage, readRecord } from '../response';

export class ActivityEndpoints {
  constructor(private client: AttioClient) {}

  async listActivities(options?: {
    limit?: number;
    cursor?: string;
  }): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    return readPage(await this.client.get('/activities', params));
  }

  async getActivity(activity: string): Promise<Record<string, unknown>> {
    return readRecord(await this.client.get(`/activities/${activity}`));
  }

  async createActivity(data: {
    data: {
      api_slug: string;
      singular_noun: string;
      plural_noun: string;
      extends: 'activities' | 'interactions' | 'calls' | 'emails';
    };
  }): Promise<Record<string, unknown>> {
    return readRecord(await this.client.post('/activities', data));
  }

  async updateActivity(
    activity: string,
    data: {
      data: {
        api_slug?: string;
        singular_noun?: string;
        plural_noun?: string;
      };
    }
  ): Promise<Record<string, unknown>> {
    return readRecord(await this.client.patch(`/activities/${activity}`, data));
  }

  async deleteActivity(activity: string): Promise<void> {
    await this.client.delete(`/activities/${activity}`);
  }
}
