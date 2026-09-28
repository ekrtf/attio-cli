import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { SqlEndpoints } from '../api/endpoints/sql';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createSqlCommand(): Command {
  return new Command('sql')
    .description('Run a SQL query against the workspace')
    .requiredOption('--query <sql>', 'SQL statement')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new SqlEndpoints(new AttioClient(options.apiKey));
        present(await api.query(options.query), options.format);
      } catch (error) {
        reportError(error);
      }
    });
}
