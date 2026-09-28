import { AttioClient } from '../client';
import { MeetingsResponseSchema, MeetingSchema, Meeting } from '../types';
import { validate } from '../../utils/validation';

export interface ListMeetingsOptions {
  limit?: number;
  cursor?: string;
  sort?: 'start_asc' | 'start_desc';
  linked_object?: string;
  linked_record_id?: string;
  participants?: string;
  ends_from?: string;
  starts_before?: string;
  timezone?: string;
}

export interface MeetingPage {
  meetings: Meeting[];
  nextCursor: string | null;
}

export class MeetingEndpoints {
  constructor(private client: AttioClient) {}

  async listMeetings(options?: ListMeetingsOptions): Promise<MeetingPage> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.sort) params.sort = options.sort;
    if (options?.linked_object) params.linked_object = options.linked_object;
    if (options?.linked_record_id) {
      params.linked_record_id = options.linked_record_id;
    }
    if (options?.participants) params.participants = options.participants;
    if (options?.ends_from) params.ends_from = options.ends_from;
    if (options?.starts_before) params.starts_before = options.starts_before;
    if (options?.timezone) params.timezone = options.timezone;

    const response = await this.client.get('/meetings', params);
    const validated = validate(MeetingsResponseSchema, response);
    const nextCursor =
      validated.pagination?.next_cursor || validated.next_cursor || null;

    return {
      meetings: validated.data,
      nextCursor,
    };
  }

  async createMeeting(data: {
    data: Record<string, unknown>;
  }): Promise<Meeting> {
    const response = await this.client.post('/meetings', data);
    const dataResponse = response as { data: unknown };
    return validate(MeetingSchema, dataResponse.data);
  }

  async updateLinkedRecords(
    meetingId: string,
    linkedRecords: Array<{ object: string; record_id: string }>,
    mode: 'patch' | 'put'
  ): Promise<Meeting> {
    const body = { data: { linked_records: linkedRecords } };
    const response =
      mode === 'patch'
        ? await this.client.patch(`/meetings/${meetingId}`, body)
        : await this.client.put(`/meetings/${meetingId}`, body);
    const dataResponse = response as { data: unknown };
    return validate(MeetingSchema, dataResponse.data);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.client.delete(`/meetings/${meetingId}`);
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.client.get(`/meetings/${meetingId}`);
    const dataResponse = response as { data: unknown };
    return validate(MeetingSchema, dataResponse.data);
  }
}
