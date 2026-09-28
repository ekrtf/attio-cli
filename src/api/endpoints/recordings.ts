import { AttioClient } from '../client';
import { Page, readPage, readRecord } from '../response';

export class RecordingEndpoints {
  constructor(private client: AttioClient) {}

  async listRecordings(
    meetingId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    return readPage(
      await this.client.get(`/meetings/${meetingId}/call_recordings`, params)
    );
  }

  async getRecording(
    meetingId: string,
    recordingId: string
  ): Promise<Record<string, unknown>> {
    return readRecord(
      await this.client.get(
        `/meetings/${meetingId}/call_recordings/${recordingId}`
      )
    );
  }

  async createRecording(
    meetingId: string,
    data: { data: { video_url?: string; transcript?: unknown } }
  ): Promise<Record<string, unknown>> {
    return readRecord(
      await this.client.post(`/meetings/${meetingId}/call_recordings`, data)
    );
  }

  async deleteRecording(meetingId: string, recordingId: string): Promise<void> {
    await this.client.delete(
      `/meetings/${meetingId}/call_recordings/${recordingId}`
    );
  }

  async getTranscript(
    meetingId: string,
    recordingId: string,
    options?: { cursor?: string }
  ): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {};
    if (options?.cursor) params.cursor = options.cursor;
    return readRecord(
      await this.client.get(
        `/meetings/${meetingId}/call_recordings/${recordingId}/transcript`,
        params
      )
    );
  }
}
