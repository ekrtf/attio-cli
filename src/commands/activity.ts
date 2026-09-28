import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ActivityEndpoints } from '../api/endpoints/activities';
import { reportError } from '../utils/cli-error';
import { present } from './present';

const EXTENDS = ['activities', 'interactions', 'calls', 'emails'] as const;

export function createActivityCommand(): Command {
  const activity = new Command('activity').description(
    'Manage custom activities'
  );

  activity
    .command('list')
    .description('List activities')
    .option('--limit <number>', 'Maximum activities to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new ActivityEndpoints(new AttioClient(options.apiKey));
        const page = await api.listActivities({
          limit: options.limit,
          cursor: options.cursor,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  activity
    .command('get')
    .description('Get an activity')
    .argument('<slug>', 'Activity slug or ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (slug: string, options) => {
      try {
        const api = new ActivityEndpoints(new AttioClient(options.apiKey));
        present(await api.getActivity(slug), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  activity
    .command('create')
    .description('Create an activity')
    .requiredOption('--api-slug <slug>', 'Snake-case API slug')
    .requiredOption('--singular <noun>', 'Singular noun')
    .requiredOption('--plural <noun>', 'Plural noun')
    .requiredOption(
      '--extends <kind>',
      'activities, interactions, calls, or emails'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        if (!EXTENDS.includes(options.extends)) {
          throw new Error(
            '--extends must be activities, interactions, calls, or emails'
          );
        }
        const api = new ActivityEndpoints(new AttioClient(options.apiKey));
        present(
          await api.createActivity({
            data: {
              api_slug: options.apiSlug,
              singular_noun: options.singular,
              plural_noun: options.plural,
              extends: options.extends,
            },
          }),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  activity
    .command('update')
    .description('Update an activity')
    .argument('<slug>', 'Activity slug or ID')
    .option('--api-slug <slug>', 'New API slug')
    .option('--singular <noun>', 'New singular noun')
    .option('--plural <noun>', 'New plural noun')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (slug: string, options) => {
      try {
        const data: {
          api_slug?: string;
          singular_noun?: string;
          plural_noun?: string;
        } = {};
        if (options.apiSlug) data.api_slug = options.apiSlug;
        if (options.singular) data.singular_noun = options.singular;
        if (options.plural) data.plural_noun = options.plural;
        if (Object.keys(data).length === 0) {
          throw new Error('Provide --api-slug, --singular, or --plural');
        }
        const api = new ActivityEndpoints(new AttioClient(options.apiKey));
        present(await api.updateActivity(slug, { data }), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  activity
    .command('delete')
    .description('Delete an activity')
    .argument('<slug>', 'Activity slug or ID')
    .action(async (slug: string, options) => {
      try {
        const api = new ActivityEndpoints(new AttioClient(options.apiKey));
        await api.deleteActivity(slug);
        console.log(`Activity ${slug} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return activity;
}
