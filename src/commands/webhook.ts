import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { WebhookEndpoints } from '../api/endpoints/webhooks';
import { reportError } from '../utils/cli-error';
import { present } from './present';

function subscriptions(raw: string | undefined): Array<{ event_type: string }> {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((event) => event.trim())
    .filter(Boolean)
    .map((event_type) => ({ event_type }));
}

export function createWebhookCommand(): Command {
  const webhook = new Command('webhook').description('Manage webhooks');

  webhook
    .command('list')
    .description('List webhooks')
    .option('--limit <number>', 'Maximum webhooks to return', parseInt)
    .option('--offset <number>', 'Number of webhooks to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new WebhookEndpoints(new AttioClient(options.apiKey));
        const page = await api.listWebhooks({
          limit: options.limit,
          offset: options.offset,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  webhook
    .command('get')
    .description('Get a webhook')
    .argument('<webhook-id>', 'Webhook ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (webhookId: string, options) => {
      try {
        const api = new WebhookEndpoints(new AttioClient(options.apiKey));
        present(await api.getWebhook(webhookId), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  webhook
    .command('create')
    .description('Create a webhook')
    .requiredOption('--target-url <url>', 'HTTPS URL that receives events')
    .requiredOption(
      '--events <types>',
      'Comma-separated event types, for example record.created,note.created'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const events = subscriptions(options.events);
        if (events.length === 0) {
          throw new Error('--events needs at least one event type');
        }
        const api = new WebhookEndpoints(new AttioClient(options.apiKey));
        present(
          await api.createWebhook({
            data: { target_url: options.targetUrl, subscriptions: events },
          }),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  webhook
    .command('update')
    .description('Update a webhook URL or its subscriptions')
    .argument('<webhook-id>', 'Webhook ID')
    .option('--target-url <url>', 'New HTTPS URL')
    .option('--events <types>', 'Comma-separated event types')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (webhookId: string, options) => {
      try {
        const data: {
          target_url?: string;
          subscriptions?: Array<{ event_type: string }>;
        } = {};
        if (options.targetUrl) data.target_url = options.targetUrl;
        if (options.events) data.subscriptions = subscriptions(options.events);
        if (Object.keys(data).length === 0) {
          throw new Error('Provide --target-url or --events');
        }
        const api = new WebhookEndpoints(new AttioClient(options.apiKey));
        present(await api.updateWebhook(webhookId, { data }), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  webhook
    .command('delete')
    .description('Delete a webhook')
    .argument('<webhook-id>', 'Webhook ID')
    .action(async (webhookId: string, options) => {
      try {
        const api = new WebhookEndpoints(new AttioClient(options.apiKey));
        await api.deleteWebhook(webhookId);
        console.log(`Webhook ${webhookId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return webhook;
}
