import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'dotenv';

export const BASE_URL = 'https://api.attio.com/v2';

let cliApiKey: string | undefined;

function hasUnsafeKeyCharacter(key: string): boolean {
  for (const char of key) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 32 || code === 127 || (code >= 128 && code <= 159)) {
      return true;
    }
  }
  return false;
}

function assertSafeApiKey(key: string, source: string): string {
  if (!key || hasUnsafeKeyCharacter(key)) {
    throw new Error(
      `${source} is empty or contains whitespace or control characters`
    );
  }
  return key;
}

/**
 * Read ATTIO_API_KEY from a dotenv file without applying any other keys.
 * A project .env must not be able to set HTTPS_PROXY or disable TLS checks.
 */
export function loadApiKeyFromEnvFile(
  envPath: string = resolve(process.cwd(), '.env')
): void {
  if (!existsSync(envPath)) {
    return;
  }

  let parsed: Record<string, string>;
  try {
    parsed = parse(readFileSync(envPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Could not read ${envPath}: ${message}`);
  }

  const key = parsed.ATTIO_API_KEY;
  if (!process.env.ATTIO_API_KEY && key) {
    process.env.ATTIO_API_KEY = key;
  }
}

loadApiKeyFromEnvFile();

export function setCliApiKey(key: string | undefined): void {
  if (!key || !key.trim()) {
    cliApiKey = undefined;
    return;
  }
  cliApiKey = assertSafeApiKey(key, '--api-key');
}

export function getApiKey(): string {
  const key = process.env.ATTIO_API_KEY || '';
  if (!key) {
    throw new Error(
      'ATTIO_API_KEY environment variable is not set. Please set it in your .env file or export it.'
    );
  }
  return assertSafeApiKey(key, 'ATTIO_API_KEY');
}

export interface Config {
  apiKey: string;
  baseUrl: string;
}

export function getConfig(apiKeyOverride?: string): Config {
  const apiKey = apiKeyOverride
    ? assertSafeApiKey(apiKeyOverride, '--api-key')
    : cliApiKey || getApiKey();

  return {
    apiKey,
    baseUrl: BASE_URL,
  };
}
