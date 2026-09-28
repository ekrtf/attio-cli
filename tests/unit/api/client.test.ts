import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AttioClient } from '../../../src/api/client';
import { RateLimitError, NotFoundError } from '../../../src/api/errors';

vi.mock('axios');

describe('AttioClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ATTIO_API_KEY = 'test-api-key';
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      const mockCreate = vi.mocked(axios.create);
      mockCreate.mockReturnValue({} as never);

      new AttioClient();

      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.attio.com/v2',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        maxRedirects: 0,
        allowAbsoluteUrls: false,
      });
    });

    it('should use override API key if provided', () => {
      const mockCreate = vi.mocked(axios.create);
      mockCreate.mockReturnValue({} as never);

      new AttioClient('override-key');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer override-key',
          }),
        })
      );
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request', async () => {
      const mockAxios = {
        request: vi.fn().mockResolvedValue({ data: { id: '123' } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);

      const client = new AttioClient();
      const result = await client.get<{ id: string }>('/test', { limit: 10 });

      expect(mockAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
        params: { limit: 10 },
      });
      expect(result).toEqual({ id: '123' });
    });

    it('should make POST request', async () => {
      const mockAxios = {
        request: vi.fn().mockResolvedValue({ data: { id: '456' } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);

      const client = new AttioClient();
      const result = await client.post<{ id: string }>('/test', {
        name: 'John',
      });

      expect(mockAxios.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data: { name: 'John' },
      });
      expect(result).toEqual({ id: '456' });
    });

    it('should make PATCH request', async () => {
      const mockAxios = {
        request: vi.fn().mockResolvedValue({ data: { updated: true } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);

      const client = new AttioClient();
      await client.patch('/test', { name: 'Jane' });

      expect(mockAxios.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/test',
        data: { name: 'Jane' },
      });
    });

    it('should make PUT request', async () => {
      const mockAxios = {
        request: vi.fn().mockResolvedValue({ data: { updated: true } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);

      const client = new AttioClient();
      await client.put('/test', { name: 'Jane' });

      expect(mockAxios.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test',
        data: { name: 'Jane' },
      });
    });

    it('should make DELETE request', async () => {
      const mockAxios = {
        request: vi.fn().mockResolvedValue({ data: { deleted: true } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);

      const client = new AttioClient();
      await client.delete('/test');

      expect(mockAxios.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test',
      });
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundError for 404', async () => {
      const mockAxios = {
        request: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 404,
            data: { error: { message: 'Not found' } },
          },
        }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const client = new AttioClient();

      await expect(client.get('/test')).rejects.toThrow(NotFoundError);
    });

    it('should retry on rate limit and eventually succeed', async () => {
      const mockAxios = {
        request: vi
          .fn()
          .mockRejectedValueOnce({
            isAxiosError: true,
            response: {
              status: 429,
              headers: { 'retry-after': '1' },
              data: { error: { message: 'Rate limited' } },
            },
          })
          .mockResolvedValueOnce({ data: { id: '123' } }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      // Mock setTimeout to avoid waiting
      vi.useFakeTimers();

      const client = new AttioClient();
      const promise = client.get('/test');

      // Fast-forward time
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual({ id: '123' });
      expect(mockAxios.request).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should throw RateLimitError after 3 retries', async () => {
      const mockAxios = {
        request: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 429,
            headers: { 'retry-after': '1' },
            data: { error: { message: 'Rate limited' } },
          },
        }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxios as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      vi.useFakeTimers();

      const client = new AttioClient();
      const promise = client.get('/test');

      // Fast-forward through all retries and wait for rejection
      const testPromise = expect(promise).rejects.toThrow(RateLimitError);
      await vi.runAllTimersAsync();
      await testPromise;

      expect(mockAxios.request).toHaveBeenCalledTimes(4); // initial + 3 retries

      vi.useRealTimers();
    });
  });
});
