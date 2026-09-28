import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ObjectEndpoints } from '../api/endpoints/objects';
import { AttributeEndpoints } from '../api/endpoints/attributes';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';

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
