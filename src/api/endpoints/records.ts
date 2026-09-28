import { z } from 'zod';
import { AttioClient } from '../client';
import { readData } from '../response';
import {
  RecordsResponseSchema,
  RecordSchema,
  AttioRecord,
  AttributeValueHistory,
  AttributeValueHistorySchema,
  ListEntriesResponseSchema,
  ListEntry,
} from '../types';
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

  async mergeRecords(
    objectSlug: string,
    primaryRecordId: string,
    secondaryRecordId: string
  ): Promise<string> {
    const response = await this.client.post(
      `/objects/${objectSlug}/records/merge`,
      {
        data: {
          primary_record_id: primaryRecordId,
          secondary_record_id: secondaryRecordId,
        },
      }
    );
    const result = readData(response, z.object({ new_record_id: z.string() }));
    return result.new_record_id;
  }

  async listEntries(
    objectSlug: string,
    recordId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ListEntry[]> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    const response = await this.client.get(
      `/objects/${objectSlug}/records/${recordId}/entries`,
      params
    );
    const validated = validate(ListEntriesResponseSchema, response);
    return validated.data;
  }

  async listAttributeValues(
    objectSlug: string,
    recordId: string,
    attributeSlug: string,
    options?: { showHistoric?: boolean; limit?: number; offset?: number }
  ): Promise<AttributeValueHistory[]> {
    const params: Record<string, unknown> = {};
    if (options?.showHistoric) params.show_historic = options.showHistoric;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    const response = await this.client.get(
      `/objects/${objectSlug}/records/${recordId}/attributes/${attributeSlug}/values`,
      params
    );
    const dataResponse = response as { data: unknown[] };
    return dataResponse.data.map((item) =>
      validate(AttributeValueHistorySchema, item)
    );
  }

  async setAttributeValues(
    objectSlug: string,
    recordId: string,
    attributeSlug: string,
    data: {
      data: {
        values: unknown[];
        replace_history: boolean;
      };
    }
  ): Promise<AttributeValueHistory[]> {
    const response = await this.client.put(
      `/objects/${objectSlug}/records/${recordId}/attributes/${attributeSlug}/values`,
      data
    );
    const dataResponse = response as { data: unknown[] };
    return dataResponse.data.map((item) =>
      validate(AttributeValueHistorySchema, item)
    );
  }
}
