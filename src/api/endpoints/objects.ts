import { AttioClient } from '../client';
import {
  ObjectsResponseSchema,
  ObjectSchema,
  ObjectType,
  Attribute,
} from '../types';
import { validate } from '../../utils/validation';
import { readPage, Page } from '../response';
import { AttributeEndpoints } from './attributes';

export class ObjectEndpoints {
  private attributeEndpoints: AttributeEndpoints;

  constructor(private client: AttioClient) {
    this.attributeEndpoints = new AttributeEndpoints(client);
  }

  async listObjects(): Promise<ObjectType[]> {
    const response = await this.client.get('/objects');
    const validated = validate(ObjectsResponseSchema, response);
    return validated.data;
  }

  async getObject(objectSlug: string): Promise<ObjectType> {
    const response = await this.client.get(`/objects/${objectSlug}`);
    const dataResponse = response as { data: unknown };
    return validate(ObjectSchema, dataResponse.data);
  }

  async createObject(data: {
    data: {
      api_slug: string;
      singular_noun: string;
      plural_noun: string;
    };
  }): Promise<ObjectType> {
    const response = await this.client.post('/objects', data);
    const dataResponse = response as { data: unknown };
    return validate(ObjectSchema, dataResponse.data);
  }

  async updateObject(
    objectSlug: string,
    data: {
      data: {
        api_slug?: string;
        singular_noun?: string;
        plural_noun?: string;
      };
    }
  ): Promise<ObjectType> {
    const response = await this.client.patch(`/objects/${objectSlug}`, data);
    const dataResponse = response as { data: unknown };
    return validate(ObjectSchema, dataResponse.data);
  }

  async deleteObject(objectSlug: string): Promise<void> {
    await this.client.delete(`/objects/${objectSlug}`);
  }

  async listViews(
    objectSlug: string,
    options?: { showArchived?: boolean; limit?: number; cursor?: string }
  ): Promise<Page> {
    const params: Record<string, unknown> = {};
    if (options?.showArchived) params.show_archived = options.showArchived;
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    const response = await this.client.get(
      `/objects/${objectSlug}/views`,
      params
    );
    return readPage(response);
  }

  // Delegate attribute operations to AttributeEndpoints for consistency
  async listAttributes(objectSlug: string): Promise<Attribute[]> {
    return this.attributeEndpoints.listAttributes('objects', objectSlug);
  }

  async getAttribute(
    objectSlug: string,
    attributeSlug: string
  ): Promise<Attribute> {
    return this.attributeEndpoints.getAttribute(
      'objects',
      objectSlug,
      attributeSlug
    );
  }
}
