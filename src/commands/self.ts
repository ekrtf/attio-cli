import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { MetaEndpoints } from '../api/endpoints/meta';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createSelfCommand(): Command {
  return new Command('self')
    .description('Show the access token currently in use')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new MetaEndpoints(new AttioClient(options.apiKey));
        present(await api.getSelf(), options.format);
      } catch (error) {
        reportError(error);
      }
    });
}
