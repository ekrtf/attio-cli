import { AttioClient } from '../client';
import { RecordsResponseSchema, RecordSchema, AttioRecord } from '../types';
import { validate } from '../../utils/validation';

export interface ListRecordsOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
  sorts?: Array<{ attribute: string; direction: 'asc' | 'desc' }>;
}

export interface CreateRecordData {
  data: Record<string, unknown>;
}

export interface UpdateRecordData {
  data: Record<string, unknown>;
}

export class RecordEndpoints {
  constructor(private client: AttioClient) {}

  async listRecords(
    objectSlug: string,
    options?: ListRecordsOptions
  ): Promise<AttioRecord[]> {
    // Always use POST /query endpoint per Attio API docs
    const response = await this.client.post(
      `/objects/${objectSlug}/records/query`,
      {
        filter: options?.filter,
        sorts: options?.sorts,
        limit: options?.limit,
        offset: options?.offset,
      }
    );
    const validated = validate(RecordsResponseSchema, response);
    return validated.data;
  }

  async getRecord(objectSlug: string, recordId: string): Promise<AttioRecord> {
    const response = await this.client.get(
      `/objects/${objectSlug}/records/${recordId}`
    );
    const dataResponse = response as { data: unknown };
    return validate(RecordSchema, dataResponse.data);
  }

  async createRecord(
    objectSlug: string,
    data: CreateRecordData
  ): Promise<AttioRecord> {
    const response = await this.client.post(
      `/objects/${objectSlug}/records`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(RecordSchema, dataResponse.data);
  }

  async updateRecord(
    objectSlug: string,
    recordId: string,
    data: UpdateRecordData
  ): Promise<AttioRecord> {
    const response = await this.client.patch(
      `/objects/${objectSlug}/records/${recordId}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(RecordSchema, dataResponse.data);
  }

  async deleteRecord(objectSlug: string, recordId: string): Promise<void> {
    await this.client.delete(`/objects/${objectSlug}/records/${recordId}`);
  }

  async replaceRecord(
    objectSlug: string,
    recordId: string,
    data: { data: { values: Record<string, unknown> } }
  ): Promise<AttioRecord> {
    const response = await this.client.put(
      `/objects/${objectSlug}/records/${recordId}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(RecordSchema, dataResponse.data);
  }

  async assertRecord(
    objectSlug: string,
    matchingAttribute: string,
    data: CreateRecordData
  ): Promise<AttioRecord> {
    const response = await this.client.put(
      `/objects/${objectSlug}/records`,
      data,
      { matching_attribute: matchingAttribute }
    );
    const dataResponse = response as { data: unknown };
    return validate(RecordSchema, dataResponse.data);
  }
}
