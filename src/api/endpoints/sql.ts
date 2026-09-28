import { z } from 'zod';
import { AttioClient } from '../client';
import { validate } from '../../utils/validation';

const SqlResponseSchema = z
  .object({
    columns: z.array(z.unknown()).optional(),
    rows: z.array(z.unknown()).optional(),
    data: z.unknown().optional(),
  })
  .passthrough();

export class SqlEndpoints {
  constructor(private client: AttioClient) {}

  async query(sql: string): Promise<unknown> {
    const response = await this.client.post('/sql', { sql });
    return validate(SqlResponseSchema, response);
  }
}
