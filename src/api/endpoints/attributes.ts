import { AttioClient } from '../client';
import {
  AttributesResponseSchema,
  AttributeSchema,
  Attribute,
  SelectOptionsResponseSchema,
  SelectOption,
  SelectOptionSchema,
  StatusesResponseSchema,
  Status,
  StatusSchema,
  AttributeWithValues,
} from '../types';
import { validate } from '../../utils/validation';

export interface ListAttributesOptions {
  show_archived?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateAttributeData {
  data: {
    title: string;
    api_slug: string;
    type: string;
    description: string;
    is_required: boolean;
    is_unique: boolean;
    is_multiselect: boolean;
    config: Record<string, unknown>;
  };
}

export interface UpdateAttributeData {
  data: {
    title?: string;
    description?: string;
    is_required?: boolean;
    is_unique?: boolean;
    is_archived?: boolean;
    config?: Record<string, unknown>;
  };
}

export interface ListOptionsOptions {
  show_archived?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateSelectOptionData {
  data: {
    title: string;
  };
}

export interface UpdateSelectOptionData {
  data: {
    title?: string;
    is_archived?: boolean;
  };
}

export interface ListStatusesOptions {
  show_archived?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateStatusData {
  data: {
    title: string;
    celebration_enabled?: boolean;
    target_time_in_status?: string; // ISO-8601 duration
  };
}

export interface UpdateStatusData {
  data: {
    title?: string;
    is_archived?: boolean;
    celebration_enabled?: boolean;
    target_time_in_status?: string | null;
  };
}

export class AttributeEndpoints {
  constructor(private client: AttioClient) {}

  // Core Attribute CRUD
  async listAttributes(
    target: 'objects' | 'lists',
    identifier: string,
    options?: ListAttributesOptions
  ): Promise<Attribute[]> {
    const params: Record<string, unknown> = {};
    if (options?.show_archived) params.show_archived = options.show_archived;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await this.client.get(
      `/${target}/${identifier}/attributes`,
      params
    );
    const validated = validate(AttributesResponseSchema, response);
    return validated.data;
  }

  async getAttribute(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string
  ): Promise<Attribute> {
    const response = await this.client.get(
      `/${target}/${identifier}/attributes/${attributeSlug}`
    );
    const dataResponse = response as { data: unknown };
    return validate(AttributeSchema, dataResponse.data);
  }

  async createAttribute(
    target: 'objects' | 'lists',
    identifier: string,
    data: CreateAttributeData
  ): Promise<Attribute> {
    const response = await this.client.post(
      `/${target}/${identifier}/attributes`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(AttributeSchema, dataResponse.data);
  }

  async updateAttribute(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    data: UpdateAttributeData
  ): Promise<Attribute> {
    const response = await this.client.patch(
      `/${target}/${identifier}/attributes/${attributeSlug}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(AttributeSchema, dataResponse.data);
  }

  // Select Options
  async listSelectOptions(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    options?: ListOptionsOptions
  ): Promise<SelectOption[]> {
    const params: Record<string, unknown> = {};
    if (options?.show_archived) params.show_archived = options.show_archived;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await this.client.get(
      `/${target}/${identifier}/attributes/${attributeSlug}/options`,
      params
    );
    const validated = validate(SelectOptionsResponseSchema, response);
    return validated.data;
  }

  async createSelectOption(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    data: CreateSelectOptionData
  ): Promise<SelectOption> {
    const response = await this.client.post(
      `/${target}/${identifier}/attributes/${attributeSlug}/options`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(SelectOptionSchema, dataResponse.data);
  }

  async updateSelectOption(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    optionId: string,
    data: UpdateSelectOptionData
  ): Promise<SelectOption> {
    const response = await this.client.patch(
      `/${target}/${identifier}/attributes/${attributeSlug}/options/${optionId}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(SelectOptionSchema, dataResponse.data);
  }

  // Statuses
  async listStatuses(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    options?: ListStatusesOptions
  ): Promise<Status[]> {
    const params: Record<string, unknown> = {};
    if (options?.show_archived) params.show_archived = options.show_archived;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await this.client.get(
      `/${target}/${identifier}/attributes/${attributeSlug}/statuses`,
      params
    );
    const validated = validate(StatusesResponseSchema, response);
    return validated.data;
  }

  async createStatus(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    data: CreateStatusData
  ): Promise<Status> {
    const response = await this.client.post(
      `/${target}/${identifier}/attributes/${attributeSlug}/statuses`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(StatusSchema, dataResponse.data);
  }

  async updateStatus(
    target: 'objects' | 'lists',
    identifier: string,
    attributeSlug: string,
    statusId: string,
    data: UpdateStatusData
  ): Promise<Status> {
    const response = await this.client.patch(
      `/${target}/${identifier}/attributes/${attributeSlug}/statuses/${statusId}`,
      data
    );
    const dataResponse = response as { data: unknown };
    return validate(StatusSchema, dataResponse.data);
  }

  // Convenience method - list attributes with their values (Phase 2)
  async listAttributesWithValues(
    target: 'objects' | 'lists',
    identifier: string,
    options?: ListAttributesOptions
  ): Promise<AttributeWithValues[]> {
    // 1. Get all attributes
    const attributes = await this.listAttributes(target, identifier, options);

    // 2. For each select/status attribute, fetch options/statuses
    const attributesWithValues = await Promise.all(
      attributes.map(async (attr) => {
        try {
          if (attr.type === 'select' || attr.type === 'multiselect') {
            const select_options = await this.listSelectOptions(
              target,
              identifier,
              attr.api_slug
            );
            return { ...attr, select_options };
          } else if (attr.type === 'status') {
            const statuses = await this.listStatuses(
              target,
              identifier,
              attr.api_slug
            );
            return { ...attr, statuses };
          }
        } catch (error) {
          // If fetching options/statuses fails, just return the attribute without them
          console.error(
            `Warning: Could not fetch values for attribute ${attr.api_slug}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
        return attr;
      })
    );

    return attributesWithValues;
  }
}
