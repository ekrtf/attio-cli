import { AttioClient } from '../client';
import { readRecord } from '../response';

export class CommentEndpoints {
  constructor(private client: AttioClient) {}

  async getComment(commentId: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/comments/${commentId}`);
    return readRecord(response);
  }

  async createComment(data: {
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const response = await this.client.post('/comments', data);
    return readRecord(response);
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.client.delete(`/comments/${commentId}`);
  }
}
