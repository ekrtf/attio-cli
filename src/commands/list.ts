import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ListEndpoints, UpdateListData } from '../api/endpoints/lists';
import { AttributeEndpoints } from '../api/endpoints/attributes';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';
import { present } from './present';

function isValidSnakeCase(str: string): boolean {
  // Valid snake_case: lowercase letters, numbers, and underscores only
  // Must start with a letter, cannot have consecutive underscores
  return /^[a-z][a-z0-9_]*[a-z0-9]$|^[a-z]$/.test(str) && !str.includes('__');
}

export function createListCommand(): Command {
  const list = new Command('list').description('Manage lists');

  // List all lists
  list
    .command('list-all')
    .description('List all lists in workspace')
    .option('--limit <number>', 'Maximum lists to return', parseInt)
    .option('--offset <number>', 'Number of lists to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);
        const lists = await listApi.listLists({
          limit: options.limit,
          offset: options.offset,
        });

        if (options.format === 'table') {
          const tableData = lists.map((l) => ({
            slug: l.api_slug,
            name: l.name,
            parent_object: Array.isArray(l.parent_object)
              ? l.parent_object.join(', ')
              : l.parent_object,
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(lists));
        } else {
          console.log(formatJson(lists));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Get specific list
  list
    .command('get')
    .description('Get a specific list')
    .argument('<list-slug>', 'List slug or ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);
        const listData = await listApi.getList(listSlug);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                slug: listData.api_slug,
                name: listData.name,
                parent_object: Array.isArray(listData.parent_object)
                  ? listData.parent_object.join(', ')
                  : listData.parent_object,
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(listData));
        } else {
          console.log(formatJson(listData));
        }
      } catch (error) {
        reportError(error);
      }
    });

  list
    .command('create')
    .description('Create a new list')
    .requiredOption('--api-slug <slug>', 'API slug for the list')
    .requiredOption('--name <name>', 'Display name for the list')
    .requiredOption(
      '--parent-object <object>',
      'Parent object slug (e.g., people, companies)'
    )
    .option(
      '--workspace-access <level>',
      'Access level (full-access|read-and-write|read-only)',
      'full-access'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        // Validate api_slug is in snake_case format
        if (!isValidSnakeCase(options.apiSlug)) {
          console.error('Error: api_slug must be in snake_case format');
          console.error(
            '  Valid format: lowercase letters, numbers, and underscores only'
          );
          console.error('  Must start with a letter');
          console.error('  Examples: my_list, test_list_1, customer_data');
          console.error(`  Invalid: ${options.apiSlug}`);
          process.exit(1);
        }

        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        const data = {
          data: {
            api_slug: options.apiSlug,
            name: options.name,
            parent_object: options.parentObject,
            workspace_access: options.workspaceAccess,
            workspace_member_access: [],
          },
        };

        const listData = await listApi.createList(data);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                slug: listData.api_slug,
                name: listData.name,
                parent_object: Array.isArray(listData.parent_object)
                  ? listData.parent_object.join(', ')
                  : listData.parent_object,
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(listData));
        } else {
          console.log(formatJson(listData));
        }
      } catch (error) {
        reportError(error);
      }
    });

  list
    .command('update')
    .description('Update a list')
    .argument('<list-slug>', 'List slug or ID')
    .option('--name <name>', 'New display name')
    .option(
      '--workspace-access <level>',
      'New access level (full-access|read-and-write|read-only)'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        const data: UpdateListData = { data: {} };

        if (options.name) data.data.name = options.name;
        if (options.workspaceAccess) {
          data.data.workspace_access = options.workspaceAccess as
            | 'full-access'
            | 'read-and-write'
            | 'read-only'
            | null;
        }

        if (Object.keys(data.data).length === 0) {
          console.error(
            'Error: Must provide at least one field to update (--name or --workspace-access)'
          );
          process.exit(1);
        }

        const listData = await listApi.updateList(listSlug, data);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                slug: listData.api_slug,
                name: listData.name,
                parent_object: Array.isArray(listData.parent_object)
                  ? listData.parent_object.join(', ')
                  : listData.parent_object,
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(listData));
        } else {
          console.log(formatJson(listData));
        }
      } catch (error) {
        reportError(error);
      }
    });

  list
    .command('views')
    .description('List saved views for a list')
    .argument('<list-slug>', 'List slug or ID')
    .option('--show-archived', 'Include archived views')
    .option('--limit <number>', 'Maximum views to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);
        const page = await listApi.listViews(listSlug, {
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
  list
    .command('attributes')
    .description('List attributes for a list')
    .argument('<list-slug>', 'List slug or ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        const attributes = await listApi.listAttributes(listSlug);

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
  list
    .command('attributes-with-values')
    .description(
      'List attributes for a list with their possible values (select options/statuses)'
    )
    .argument('<list-slug>', 'List slug or ID')
    .option('--show-archived', 'Include archived attributes and options')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const attributeApi = new AttributeEndpoints(client);

        const attributes = await attributeApi.listAttributesWithValues(
          'lists',
          listSlug,
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

  return list;
}
