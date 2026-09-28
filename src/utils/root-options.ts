import { setCliApiKey } from './config';
import { setVerboseErrors } from './cli-error';

export interface RootOptions {
  apiKey?: string;
  debug?: boolean;
}

export function applyRootOptions(options: RootOptions): void {
  if (options.apiKey) {
    console.error(
      'Warning: --api-key is visible in the process list. Prefer ATTIO_API_KEY.'
    );
  }
  setCliApiKey(options.apiKey);
  setVerboseErrors(Boolean(options.debug));
}
