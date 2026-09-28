import { z } from 'zod';
import { validate } from '../utils/validation';

const PageSchema = z
  .object({
    data: z.array(z.record(z.unknown())),
    pagination: z
      .object({
        next_cursor: z.string().nullable().optional(),
      })
      .optional(),
    next_cursor: z.string().nullable().optional(),
  })
  .passthrough();

export interface Page {
  items: Array<Record<string, unknown>>;
  nextCursor: string | null;
}

export function readPage(response: unknown): Page {
  const parsed = validate(PageSchema, response);
  return {
    items: parsed.data,
    nextCursor: parsed.pagination?.next_cursor || parsed.next_cursor || null,
  };
}

export function readRecord(response: unknown): Record<string, unknown> {
  return readData(response, z.record(z.unknown()));
}

export function readData<T>(response: unknown, schema: z.ZodSchema<T>): T {
  const envelope = validate(
    z.object({ data: z.unknown() }).passthrough(),
    response
  );
  return validate(schema, envelope.data);
}
