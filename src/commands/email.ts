import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { EmailEndpoints } from '../api/endpoints/emails';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createEmailCommand(): Command {
  const email = new Command('email').description('Read synced emails');

  email
    .command('list')
    .description('List emails')
    .option('--limit <number>', 'Maximum emails to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--linked-object <slug>', 'Object slug')
    .option('--linked-record-ids <ids>', 'Comma-separated record IDs')
    .option('--participants <emails>', 'Comma-separated participant emails')
    .option('--domain <domain>', 'Filter by email domain')
    .option('--sent-after <iso>', 'Only emails sent after this time')
    .option('--sent-before <iso>', 'Only emails sent before this time')
    .option('--exclude-automated', 'Exclude participants that look automated')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new EmailEndpoints(new AttioClient(options.apiKey));
        const page = await api.listEmails({
          limit: options.limit,
          cursor: options.cursor,
          linkedObject: options.linkedObject,
          linkedRecordIds: options.linkedRecordIds,
          participants: options.participants,
          domain: options.domain,
          sentAfter: options.sentAfter,
          sentBefore: options.sentBefore,
          excludeAutomatedParticipants: options.excludeAutomated,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  return email;
}
