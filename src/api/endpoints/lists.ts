import { AttioClient } from '../client';
import {
  ListsResponseSchema,
  ListSchema,
  List,
  ListEntriesResponseSchema,
  ListEntry,
  ListEntrySchema,
  AttributeValueHistory,
  AttributeValueHistorySchema,
  Attribute,
} from '../types';
import { validate } from '../../utils/validation';
import { AttributeEndpoints } from './attributes';

export interface ListOptions {
  limit?: number;
  offset?: number;
}

export interface ListEntriesOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
  sorts?: Array<{ attribute: string; direction: 'asc' | 'desc' }>;
}

export interface CreateEntryData {
  data: {
    parent_record_id: string;
    parent_object: string;
    entry_values: Record<string, unknown>;
  };
}

export interface UpdateEntryData {
  data: {
    entry_values: Record<string, unknown>; // Attributes to update
  };
}

export interface AssertEntryData {
  data: {
    parent_record_id?: string;
    parent_object?: string;
    entry_values: Record<string, unknown>; // All entry attribute values
  };
}

export interface ListEntryAttributeValuesOptions {
  show_historic?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateListData {
  data: {
    api_slug: string;
    name: string;
    parent_object: string;
    workspace_access?: 'full-access' | 'read-and-write' | 'read-only' | null;
    workspace_member_access: Array<{
      workspace_member_id: string;
      level: 'full-access' | 'read-and-write' | 'read-only';
    }>;
  };
}

export interface UpdateListData {
  data: {
    name?: string;
    workspace_access?: 'full-access' | 'read-and-write' | 'read-only' | null;
  };
}

export class ListEndpoints {
  private attributeEndpoints: AttributeEndpoints;

  constructor(private client: AttioClient) {
    this.attributeEndpoints = new AttributeEndpoints(client);
  }

  async listLists(options?: ListOptions): Promise<List[]> {
    const response = await this.client.get('/lists');
    const validated = validate(ListsResponseSchema, response);

    let lists = validated.data;
    if (options?.offset !== undefined) {
      lists = lists.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      lists = lists.slice(0, options.limit);
    }
    return lists;
  }

  async getList(listSlug: string): Promise<List> {
    const response = await this.client.get(`/lists/${listSlug}`);
    const dataResponse = response as { data: unknown };
    return validate(ListSchema, dataResponse.data);
  }

  async listEntries(
    listSlug: string,
    options?: ListEntriesOptions
  ): Promise<ListEntry[]> {
    const response = await this.client.post(
      `/lists/${listSlug}/entries/query`,
      {
        filter: options?.filter,
        sorts: options?.sorts,
        limit: options?.limit,
        offset: options?.offset,
      }
    );
    const validated = validate(ListEntriesResponseSchema, response);
    return validated.data;
  }

  async getEntry(listSlug: string, entryId: string): Promise<ListEntry> {
    const response = await this.client.get(
      `/lists/${listSlug}/entries/${entryId}`
    );
    const dataResponse = response as { data: unknown };
    return validate(ListEntrySchema, dataResponse.data);
  }

  async createEntry(
    listSlug: string,
    entryData: CreateEntryData
  ): Promise<ListEntry> {
    const response = await this.client.post(
      `/lists/${listSlug}/entries`,
      entryData
    );
    const dataResponse = response as { data: unknown };
    return validate(ListEntrySchema, dataResponse.data);
  }

  async updateEntry(
    listSlug: string,
    entryId: string,
    data: UpdateEntryData
  ): Promise<ListEntry> {
    const response = await this.client.patch(
      `/lists/${listSlug}/entries/${entryId}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(ListEntrySchema, dataResponse.data);
  }

  async deleteEntry(listSlug: string, entryId: string): Promise<void> {
    await this.client.delete(`/lists/${listSlug}/entries/${entryId}`);
  }

  async assertEntry(
    listSlug: string,
    data: AssertEntryData
  ): Promise<ListEntry> {
    const response = await this.client.put(`/lists/${listSlug}/entries`, data);
    const dataResponse = response as { data: unknown };
    return validate(ListEntrySchema, dataResponse.data);
  }

  async listEntryAttributeValues(
    listSlug: string,
    entryId: string,
    attributeSlug: string,
    options?: ListEntryAttributeValuesOptions
  ): Promise<AttributeValueHistory[]> {
    const params: Record<string, unknown> = {};
    if (options?.show_historic) params.show_historic = options.show_historic;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await this.client.get(
      `/lists/${listSlug}/entries/${entryId}/attributes/${attributeSlug}/values`,
      params
    );

    const dataResponse = response as { data: unknown[] };
    return dataResponse.data.map((item) =>
      validate(AttributeValueHistorySchema, item)
    );
  }

  async createList(data: CreateListData): Promise<List> {
    const response = await this.client.post('/lists', data);
    const dataResponse = response as { data: unknown };
    return validate(ListSchema, dataResponse.data);
  }

  async updateList(listSlug: string, data: UpdateListData): Promise<List> {
    const response = await this.client.patch(`/lists/${listSlug}`, data);
    const dataResponse = response as { data: unknown };
    return validate(ListSchema, dataResponse.data);
  }

  // Delegate attribute operations to AttributeEndpoints for consistency
  async listAttributes(listSlug: string): Promise<Attribute[]> {
    return this.attributeEndpoints.listAttributes('lists', listSlug);
  }

  async getAttribute(
    listSlug: string,
    attributeSlug: string
  ): Promise<Attribute> {
    return this.attributeEndpoints.getAttribute(
      'lists',
      listSlug,
      attributeSlug
    );
  }
}
