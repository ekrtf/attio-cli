import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { getConfig } from '../utils/config';
import { parseApiError, RateLimitError } from './errors';
import { safeApiPath } from './url';

const MAX_RETRY_AFTER_SECONDS = 60;

export function retryAfterSeconds(header: unknown): number {
  let raw: string | number | undefined;
  if (typeof header === 'string' || typeof header === 'number') {
    raw = header;
  } else if (Array.isArray(header)) {
    const first: unknown = (header as unknown[])[0];
    if (typeof first === 'string' || typeof first === 'number') {
      raw = first;
    }
  }

  const parsed =
    typeof raw === 'string'
      ? Number.parseInt(raw, 10)
      : typeof raw === 'number'
        ? raw
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }

  return Math.min(Math.floor(parsed), MAX_RETRY_AFTER_SECONDS);
}

function redactSecret(value: unknown, secret: string): unknown {
  if (!secret) {
    return value;
  }
  const json = JSON.stringify(value);
  if (!json || !json.includes(secret)) {
    return value;
  }
  return JSON.parse(json.split(secret).join('[redacted]')) as unknown;
}

export class AttioClient {
  private axiosInstance: AxiosInstance;
  private apiKey: string;

  constructor(apiKeyOverride?: string) {
    const config = getConfig(apiKeyOverride);
    this.apiKey = config.apiKey;

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      maxRedirects: 0,
      allowAbsoluteUrls: false,
    });
  }

  private async request<T>(
    config: AxiosRequestConfig,
    retryCount = 0,
    alreadyEncoded = false
  ): Promise<T> {
    const safeConfig: AxiosRequestConfig = alreadyEncoded
      ? config
      : {
          ...config,
          url: safeApiPath(config.url || ''),
        };

    try {
      const response: AxiosResponse<T> =
        await this.axiosInstance.request(safeConfig);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleError<T>(error, safeConfig, retryCount);
      }
      throw error;
    }
  }

  private async handleError<T>(
    error: AxiosError,
    config: AxiosRequestConfig,
    retryCount: number
  ): Promise<T> {
    if (!error.response) {
      throw new Error(error.message);
    }

    const statusCode = error.response.status || 500;
    const data = error.response.data;

    if (process.env.DEBUG_API_ERRORS) {
      console.error(
        'API Error Details:',
        JSON.stringify(
          {
            status: statusCode,
            url: config.url,
            method: config.method,
            data: redactSecret(data, this.apiKey),
            requestBody: redactSecret(config.data, this.apiKey),
          },
          null,
          2
        )
      );
    }

    if (statusCode === 429) {
      const retryAfter = retryAfterSeconds(
        error.response?.headers?.['retry-after']
      );

      if (retryCount < 3) {
        await this.sleep(retryAfter * 1000);
        return this.request<T>(config, retryCount + 1, true);
      }

      throw new RateLimitError(retryAfter);
    }

    throw parseApiError(statusCode, data);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url: path,
      params,
    });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url: path,
      data,
    });
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url: path,
      data,
    });
  }

  async put<T>(
    path: string,
    data?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url: path,
      data,
      ...(params ? { params } : {}),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url: path,
    });
  }
}
