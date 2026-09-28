import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ThreadEndpoints } from '../api/endpoints/threads';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createThreadCommand(): Command {
  const thread = new Command('thread').description('Read comment threads');

  thread
    .command('list')
    .description('List threads for a record or list entry')
    .option('--record-id <id>', 'Record ID')
    .option('--object <slug>', 'Object slug, used with --record-id')
    .option('--entry-id <id>', 'List entry ID')
    .option('--list <slug>', 'List slug, used with --entry-id')
    .option('--limit <number>', 'Maximum threads to return', parseInt)
    .option('--offset <number>', 'Number of threads to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new ThreadEndpoints(new AttioClient(options.apiKey));
        const page = await api.listThreads({
          recordId: options.recordId,
          object: options.object,
          entryId: options.entryId,
          list: options.list,
          limit: options.limit,
          offset: options.offset,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  thread
    .command('get')
    .description('Get a thread and its comments')
    .argument('<thread-id>', 'Thread ID')
    .option('--limit <number>', 'Maximum comments to return', parseInt)
    .option('--cursor <cursor>', 'Comment pagination cursor')
    .option('--created-after <iso>', 'Only comments created after this time')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (threadId: string, options) => {
      try {
        const api = new ThreadEndpoints(new AttioClient(options.apiKey));
        present(
          await api.getThread(threadId, {
            limit: options.limit,
            cursor: options.cursor,
            createdAfter: options.createdAfter,
          }),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  return thread;
}
