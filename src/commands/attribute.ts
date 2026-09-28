import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { AttributeEndpoints } from '../api/endpoints/attributes';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';

function isValidSnakeCase(str: string): boolean {
  // Valid snake_case: lowercase letters, numbers, and underscores only
  // Must start with a letter, cannot have consecutive underscores
  return /^[a-z][a-z0-9_]*[a-z0-9]$|^[a-z]$/.test(str) && !str.includes('__');
}

export function createAttributeCommand(): Command {
  const attribute = new Command('attribute').description(
    'Manage attributes for objects and lists'
  );

  // List attributes
  attribute
    .command('list')
    .description('List attributes for an object or list')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .option('--show-archived', 'Include archived attributes')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (target: string, identifier: string, options) => {
      try {
        if (target !== 'objects' && target !== 'lists') {
          console.error('Error: target must be either "objects" or "lists"');
          process.exit(1);
        }

        const client = new AttioClient(options.apiKey);
        const attributeApi = new AttributeEndpoints(client);

        const attributes = await attributeApi.listAttributes(
          target as 'objects' | 'lists',
          identifier,
          { show_archived: options.showArchived }
        );

        if (options.format === 'table') {
          const tableData = attributes.map((attr) => ({
            slug: attr.api_slug,
            title: attr.title,
            type: attr.type,
            required: attr.is_required,
            unique: attr.is_unique,
            archived: attr.is_archived,
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

  // Get single attribute
  attribute
    .command('get')
    .description('Get a specific attribute')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const attr = await attributeApi.getAttribute(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug
          );

          if (options.format === 'table') {
            const tableData = [
              {
                slug: attr.api_slug,
                title: attr.title,
                type: attr.type,
                required: attr.is_required,
                unique: attr.is_unique,
                archived: attr.is_archived,
                system: attr.is_system_attribute,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(attr));
          } else {
            console.log(formatJson(attr));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Create attribute
  attribute
    .command('create')
    .description('Create a new attribute')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .requiredOption('--title <title>', 'Attribute title')
    .requiredOption('--slug <slug>', 'API slug (snake_case)')
    .requiredOption(
      '--type <type>',
      'Attribute type (text, number, select, status, etc.)'
    )
    .option('--description <description>', 'Attribute description')
    .option('--required', 'Mark as required')
    .option('--unique', 'Mark as unique')
    .option('--multiselect', 'Enable multiselect (for select type)')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (target: string, identifier: string, options) => {
      try {
        if (target !== 'objects' && target !== 'lists') {
          console.error('Error: target must be either "objects" or "lists"');
          process.exit(1);
        }

        if (!isValidSnakeCase(options.slug)) {
          console.error('Error: slug must be in snake_case format');
          console.error(
            '  Valid format: lowercase letters, numbers, and underscores only'
          );
          console.error('  Must start with a letter');
          console.error('  Examples: email_address, deal_status, company_size');
          console.error(`  Invalid: ${options.slug}`);
          process.exit(1);
        }

        const client = new AttioClient(options.apiKey);
        const attributeApi = new AttributeEndpoints(client);

        const data = {
          data: {
            title: options.title,
            api_slug: options.slug,
            type: options.type,
            description: options.description || '',
            is_required: options.required || false,
            is_unique: options.unique || false,
            is_multiselect: options.multiselect || false,
            config: {},
          },
        };

        const attr = await attributeApi.createAttribute(
          target as 'objects' | 'lists',
          identifier,
          data
        );

        if (options.format === 'table') {
          const tableData = [
            {
              slug: attr.api_slug,
              title: attr.title,
              type: attr.type,
              required: attr.is_required,
              unique: attr.is_unique,
            },
          ];
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(attr));
        } else {
          console.log(formatJson(attr));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Update attribute
  attribute
    .command('update')
    .description('Update an attribute')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .option('--title <title>', 'New title')
    .option('--description <description>', 'New description')
    .option('--required <value>', 'Set required (true|false)', (val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    )
    .option('--unique <value>', 'Set unique (true|false)', (val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const data: { data: Record<string, unknown> } = { data: {} };

          if (options.title) data.data.title = options.title;
          if (options.description) data.data.description = options.description;
          if (options.required !== undefined)
            data.data.is_required = options.required;
          if (options.unique !== undefined)
            data.data.is_unique = options.unique;

          if (Object.keys(data.data).length === 0) {
            console.error(
              'Error: Must provide at least one field to update (--title, --description, --required, --unique)'
            );
            process.exit(1);
          }

          const attr = await attributeApi.updateAttribute(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            data
          );

          if (options.format === 'table') {
            const tableData = [
              {
                slug: attr.api_slug,
                title: attr.title,
                type: attr.type,
                required: attr.is_required,
                unique: attr.is_unique,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(attr));
          } else {
            console.log(formatJson(attr));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Archive attribute (Note: Attio API does not support deleting attributes)
  attribute
    .command('archive')
    .description(
      'Archive an attribute (Note: attributes cannot be deleted, only archived via update)'
    )
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .action(
      async (target: string, identifier: string, attributeSlug: string) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient();
          const attributeApi = new AttributeEndpoints(client);
          const attr = await attributeApi.updateAttribute(
            target,
            identifier,
            attributeSlug,
            { data: { is_archived: true } }
          );
          console.log(formatJson(attr));
        } catch (error) {
          reportError(error);
        }
      }
    );

  // List select options
  attribute
    .command('options')
    .description('List select options for an attribute')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .option('--show-archived', 'Include archived options')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const selectOptions = await attributeApi.listSelectOptions(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            { show_archived: options.showArchived }
          );

          if (options.format === 'table') {
            const tableData = selectOptions.map((opt) => ({
              option_id: opt.id.option_id,
              title: opt.title,
              archived: opt.is_archived,
            }));
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(selectOptions));
          } else {
            console.log(formatJson(selectOptions));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Create select option
  attribute
    .command('option-create')
    .description('Create a select option')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .requiredOption('--title <title>', 'Option title')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const option = await attributeApi.createSelectOption(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            { data: { title: options.title } }
          );

          if (options.format === 'table') {
            const tableData = [
              {
                option_id: option.id.option_id,
                title: option.title,
                archived: option.is_archived,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(option));
          } else {
            console.log(formatJson(option));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Update select option
  attribute
    .command('option-update')
    .description('Update a select option')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .argument('<option-id>', 'Option ID')
    .option('--title <title>', 'New title')
    .option('--archived <value>', 'Set archived (true|false)', (val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        optionId: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const data: { data: Record<string, unknown> } = { data: {} };

          if (options.title) data.data.title = options.title;
          if (options.archived !== undefined)
            data.data.is_archived = options.archived;

          if (Object.keys(data.data).length === 0) {
            console.error(
              'Error: Must provide at least one field to update (--title, --archived)'
            );
            process.exit(1);
          }

          const option = await attributeApi.updateSelectOption(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            optionId,
            data
          );

          if (options.format === 'table') {
            const tableData = [
              {
                option_id: option.id.option_id,
                title: option.title,
                archived: option.is_archived,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(option));
          } else {
            console.log(formatJson(option));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Archive select option (Note: API may not support deleting options)
  attribute
    .command('option-archive')
    .description('Archive a select option (recommended over delete)')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .argument('<option-id>', 'Option ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        optionId: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const archivedOption = await attributeApi.updateSelectOption(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            optionId,
            {
              data: {
                is_archived: true,
              },
            }
          );

          console.log(`Select option ${optionId} archived successfully`);

          if (options.format === 'json') {
            console.log(formatJson(archivedOption));
          } else if (options.format === 'table') {
            console.log(
              formatGenericTable([
                {
                  option_id: archivedOption.id.option_id,
                  title: archivedOption.title,
                  archived: archivedOption.is_archived,
                },
              ])
            );
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // List statuses
  attribute
    .command('statuses')
    .description('List statuses for an attribute')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .option('--show-archived', 'Include archived statuses')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const statuses = await attributeApi.listStatuses(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            { show_archived: options.showArchived }
          );

          if (options.format === 'table') {
            const tableData = statuses.map((status) => ({
              status_id: status.id.status_id,
              title: status.title,
              celebration: status.celebration_enabled,
              archived: status.is_archived,
            }));
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(statuses));
          } else {
            console.log(formatJson(statuses));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Create status
  attribute
    .command('status-create')
    .description('Create a status')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .requiredOption('--title <title>', 'Status title')
    .option('--celebration', 'Enable celebration')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const data = {
            data: {
              title: options.title,
              ...(options.celebration && { celebration_enabled: true }),
            },
          };

          const status = await attributeApi.createStatus(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            data
          );

          if (options.format === 'table') {
            const tableData = [
              {
                status_id: status.id.status_id,
                title: status.title,
                celebration: status.celebration_enabled,
                archived: status.is_archived,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(status));
          } else {
            console.log(formatJson(status));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Update status
  attribute
    .command('status-update')
    .description('Update a status')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .argument('<status-id>', 'Status ID')
    .option('--title <title>', 'New title')
    .option('--celebration <value>', 'Set celebration (true|false)', (val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    )
    .option('--archived <value>', 'Set archived (true|false)', (val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        statusId: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const data: { data: Record<string, unknown> } = { data: {} };

          if (options.title) data.data.title = options.title;
          if (options.celebration !== undefined)
            data.data.celebration_enabled = options.celebration;
          if (options.archived !== undefined)
            data.data.is_archived = options.archived;

          if (Object.keys(data.data).length === 0) {
            console.error(
              'Error: Must provide at least one field to update (--title, --celebration, --archived)'
            );
            process.exit(1);
          }

          const status = await attributeApi.updateStatus(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            statusId,
            data
          );

          if (options.format === 'table') {
            const tableData = [
              {
                status_id: status.id.status_id,
                title: status.title,
                celebration: status.celebration_enabled,
                archived: status.is_archived,
              },
            ];
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(status));
          } else {
            console.log(formatJson(status));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  // Archive status (Note: API may not support deleting statuses)
  attribute
    .command('status-archive')
    .description('Archive a status (recommended over delete)')
    .argument('<target>', 'Target type (objects or lists)')
    .argument('<identifier>', 'Object/list slug or ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .argument('<status-id>', 'Status ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        target: string,
        identifier: string,
        attributeSlug: string,
        statusId: string,
        options
      ) => {
        try {
          if (target !== 'objects' && target !== 'lists') {
            console.error('Error: target must be either "objects" or "lists"');
            process.exit(1);
          }

          const client = new AttioClient(options.apiKey);
          const attributeApi = new AttributeEndpoints(client);

          const archivedStatus = await attributeApi.updateStatus(
            target as 'objects' | 'lists',
            identifier,
            attributeSlug,
            statusId,
            {
              data: {
                is_archived: true,
              },
            }
          );

          console.log(`Status ${statusId} archived successfully`);

          if (options.format === 'json') {
            console.log(formatJson(archivedStatus));
          } else if (options.format === 'table') {
            console.log(
              formatGenericTable([
                {
                  status_id: archivedStatus.id.status_id,
                  title: archivedStatus.title,
                  archived: archivedStatus.is_archived,
                },
              ])
            );
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  return attribute;
}
