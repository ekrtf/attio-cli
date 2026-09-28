import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { SequenceEndpoints } from '../api/endpoints/sequences';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createSequenceCommand(): Command {
  const sequence = new Command('sequence').description(
    'Manage sequence subscriptions'
  );

  sequence
    .command('unsubscribe')
    .description('Add email addresses to the unsubscribe list')
    .requiredOption(
      '--email <address>',
      'Email address. Repeat the flag for more than one.',
      (value: string, previous: string[]) => previous.concat(value),
      [] as string[]
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const emails = options.email as string[];
        if (!emails || emails.length === 0) {
          throw new Error('Provide at least one --email');
        }
        const api = new SequenceEndpoints(new AttioClient(options.apiKey));
        const page = await api.unsubscribe(emails);
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  return sequence;
}
