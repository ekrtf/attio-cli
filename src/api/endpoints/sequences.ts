import { AttioClient } from '../client';
import { Page, readPage } from '../response';

export class SequenceEndpoints {
  constructor(private client: AttioClient) {}

  async unsubscribe(emailAddresses: string[]): Promise<Page> {
    return readPage(
      await this.client.post('/sequences/unsubscribed_emails', {
        data: { email_addresses: emailAddresses },
      })
    );
  }
}
