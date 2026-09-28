import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ObjectEndpoints } from '../api/endpoints/objects';
import { AttributeEndpoints } from '../api/endpoints/attributes';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createObjectCommand(): Command {
  const object = new Command('object').description(
    'Manage objects and attributes'
  );

  // List objects
  object
    .command('list')
    .description('List all objects in the workspace')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);

        const objects = await objectApi.listObjects();

        if (options.format === 'table') {
          const tableData = objects.map((obj) => ({
            slug: obj.api_slug,
            singular: obj.singular_noun,
            plural: obj.plural_noun,
            built_in: obj.is_built_in,
            workspace_level: obj.is_workspace_level,
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(objects));
        } else {
          console.log(formatJson(objects));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Get object
  object
    .command('get')
    .description('Get a specific object')
    .argument('<slug>', 'Object slug (e.g., people, companies, deals)')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (slug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);

        const obj = await objectApi.getObject(slug);

        if (options.format === 'table') {
          const tableData = [
            {
              slug: obj.api_slug,
              singular: obj.singular_noun,
              plural: obj.plural_noun,
              built_in: obj.is_built_in,
              workspace_level: obj.is_workspace_level,
            },
          ];
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(obj));
        } else {
          console.log(formatJson(obj));
        }
      } catch (error) {
        reportError(error);
      }
    });

  object
    .command('create')
    .description('Create a custom object')
    .requiredOption('--api-slug <slug>', 'Snake-case API slug')
    .requiredOption('--singular <noun>', 'Singular noun, for example Person')
    .requiredOption('--plural <noun>', 'Plural noun, for example People')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        if (!/^[a-z][a-z0-9_]*$/.test(options.apiSlug)) {
          throw new Error(
            'api_slug must be snake_case: lowercase letters, numbers, and underscores, starting with a letter'
          );
        }
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);
        const created = await objectApi.createObject({
          data: {
            api_slug: options.apiSlug,
            singular_noun: options.singular,
            plural_noun: options.plural,
          },
        });
        if (options.format === 'csv') {
          console.log(formatCsv(created));
        } else if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                slug: created.api_slug,
                singular: created.singular_noun,
                plural: created.plural_noun,
              },
            ])
          );
        } else {
          console.log(formatJson(created));
        }
      } catch (error) {
        reportError(error);
      }
    });

  object
    .command('update')
    .description('Update an object definition')
    .argument('<slug>', 'Object slug or ID')
    .option('--api-slug <slug>', 'New snake-case API slug')
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
          throw new Error(
            'Provide at least one of --api-slug, --singular, or --plural'
          );
        }
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);
        const updated = await objectApi.updateObject(slug, { data });
        if (options.format === 'csv') {
          console.log(formatCsv(updated));
        } else if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                slug: updated.api_slug,
                singular: updated.singular_noun,
                plural: updated.plural_noun,
              },
            ])
          );
        } else {
          console.log(formatJson(updated));
        }
      } catch (error) {
        reportError(error);
      }
    });

  object
    .command('delete')
    .description('Delete a custom object')
    .argument('<slug>', 'Object slug or ID')
    .action(async (slug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);
        await objectApi.deleteObject(slug);
        console.log(`Object ${slug} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  object
    .command('views')
    .description('List saved views for an object')
    .argument('<slug>', 'Object slug or ID')
    .option('--show-archived', 'Include archived views')
    .option('--limit <number>', 'Maximum views to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (slug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);
        const page = await objectApi.listViews(slug, {
          showArchived: options.showArchived,
          limit: options.limit,
          cursor: options.cursor,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  // List attributes
  object
    .command('attributes')
    .description('List attributes for an object')
    .argument('<object-slug>', 'Object slug (e.g., people, companies)')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (objectSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const objectApi = new ObjectEndpoints(client);

        const attributes = await objectApi.listAttributes(objectSlug);

        if (options.format === 'table') {
          const tableData = attributes.map((attr) => ({
            slug: attr.api_slug,
            title: attr.title,
            type: attr.type,
            required: attr.is_required,
            unique: attr.is_unique,
            system: attr.is_system_attribute,
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(attributes));
        } else {
          console.log(formatJson(attributes));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // List attributes with values (convenience command)
  object
    .command('attributes-with-values')
    .description(
      'List attributes for an object with their possible values (select options/statuses)'
    )
    .argument('<object-slug>', 'Object slug (e.g., people, companies)')
    .option('--show-archived', 'Include archived attributes and options')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (objectSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const attributeApi = new AttributeEndpoints(client);

        const attributes = await attributeApi.listAttributesWithValues(
          'objects',
          objectSlug,
          { show_archived: options.showArchived }
        );

        if (options.format === 'table') {
          const tableData = attributes.map((attr) => {
            const baseData: Record<string, unknown> = {
              slug: attr.api_slug,
              title: attr.title,
              type: attr.type,
              required: attr.is_required,
              unique: attr.is_unique,
            };

            if (attr.select_options) {
              baseData.options = attr.select_options
                .map((opt) => opt.title)
                .join(', ');
            } else if (attr.statuses) {
              baseData.statuses = attr.statuses.map((s) => s.title).join(', ');
            }

            return baseData;
          });
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(attributes));
        } else {
          console.log(formatJson(attributes));
        }
      } catch (error) {
        reportError(error);
      }
    });

  return object;
}
