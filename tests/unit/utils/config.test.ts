import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getApiKey,
  getConfig,
  BASE_URL,
  loadApiKeyFromEnvFile,
  setCliApiKey,
} from '../../../src/utils/config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    setCliApiKey(undefined);
  });

  describe('getApiKey', () => {
    it('should return API key from environment variable', () => {
      process.env.ATTIO_API_KEY = 'test-api-key';
      expect(getApiKey()).toBe('test-api-key');
    });

    it('should throw error if API key is not set', () => {
      delete process.env.ATTIO_API_KEY;
      expect(() => getApiKey()).toThrow(
        'ATTIO_API_KEY environment variable is not set'
      );
    });

    it('should throw error if API key is empty string', () => {
      process.env.ATTIO_API_KEY = '';
      expect(() => getApiKey()).toThrow(
        'ATTIO_API_KEY environment variable is not set'
      );
    });
  });

  describe('getConfig', () => {
    it('should return config with API key from environment', () => {
      process.env.ATTIO_API_KEY = 'test-api-key';
      const config = getConfig();
      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe(BASE_URL);
    });

    it('should use override API key if provided', () => {
      process.env.ATTIO_API_KEY = 'env-api-key';
      const config = getConfig('override-api-key');
      expect(config.apiKey).toBe('override-api-key');
      expect(config.baseUrl).toBe(BASE_URL);
    });

    it('should prefer the CLI key over the environment', () => {
      process.env.ATTIO_API_KEY = 'env-api-key';
      setCliApiKey('cli-api-key');
      expect(getConfig().apiKey).toBe('cli-api-key');
      setCliApiKey(undefined);
    });
  });

  describe('loadApiKeyFromEnvFile', () => {
    it('loads only ATTIO_API_KEY from a dotenv file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'attio-cli-'));
      const envPath = join(dir, '.env');
      writeFileSync(
        envPath,
        'ATTIO_API_KEY=file-key\nHTTPS_PROXY=http://attacker.example:8080\nNODE_TLS_REJECT_UNAUTHORIZED=0\n'
      );
      delete process.env.ATTIO_API_KEY;
      const proxyBefore = process.env.HTTPS_PROXY;
      const tlsBefore = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

      loadApiKeyFromEnvFile(envPath);

      expect(process.env.ATTIO_API_KEY).toBe('file-key');
      expect(process.env.HTTPS_PROXY).toBe(proxyBefore);
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe(tlsBefore);
    });

    it('does not override an existing API key', () => {
      const dir = mkdtempSync(join(tmpdir(), 'attio-cli-'));
      const envPath = join(dir, '.env');
      writeFileSync(envPath, 'ATTIO_API_KEY=file-key\n');
      process.env.ATTIO_API_KEY = 'already-set';

      loadApiKeyFromEnvFile(envPath);

      expect(process.env.ATTIO_API_KEY).toBe('already-set');
    });
  });
});
