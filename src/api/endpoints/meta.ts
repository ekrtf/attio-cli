import { AttioClient } from '../client';

export class MetaEndpoints {
  constructor(private client: AttioClient) {}

  async getSelf(): Promise<unknown> {
    return this.client.get('/self');
  }
}
