import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { ListEndpoints } from '../api/endpoints/lists';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { validateFilterStructure } from '../utils/filter-validator';
import { compactRecordValues } from '../utils/compact-formatter';
import { reportError } from '../utils/cli-error';

export function createEntryCommand(): Command {
  const entry = new Command('entry').description('Manage list entries');

  entry
    .command('list')
    .description('List entries in a list')
    .argument('<list-slug>', 'List slug or ID')
    .option('--limit <number>', 'Maximum entries to return', parseInt)
    .option('--offset <number>', 'Number of entries to skip', parseInt)
    .option(
      '--filter <json>',
      'Filter query as JSON (e.g., \'{"status":{"$eq":"active"}}\')'
    )
    .option(
      '--sort <json>',
      'Sort specification as JSON (e.g., \'[{"attribute":"created_at","direction":"desc"}]\')'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        // Parse filter if provided
        let filter;
        if (options.filter) {
          try {
            filter = JSON.parse(options.filter);

            // Validate filter structure
            const validation = validateFilterStructure(filter);
            if (!validation.valid) {
              console.error('Error: Invalid filter structure');
              validation.errors.forEach((err) => console.error(`  - ${err}`));
              console.error(
                '\nExample: --filter \'{"status":{"$eq":"active"}}\''
              );
              process.exit(1);
            }
          } catch (error) {
            console.error('Error: Invalid JSON in --filter option');
            console.error('Example: --filter \'{"status":{"$eq":"active"}}\'');
            process.exit(1);
          }
        }

        // Parse sort if provided
        let sorts;
        if (options.sort) {
          try {
            sorts = JSON.parse(options.sort);
            if (!Array.isArray(sorts)) {
              throw new Error('Sort must be an array');
            }
          } catch (error) {
            console.error('Error: Invalid JSON in --sort option');
            console.error(
              'Example: --sort \'[{"attribute":"created_at","direction":"desc"}]\''
            );
            process.exit(1);
          }
        }

        const entries = await listApi.listEntries(listSlug, {
          limit: options.limit,
          offset: options.offset,
          filter: filter,
          sorts: sorts,
        });

        // Apply compact formatting unless verbose mode is enabled
        const displayEntries = options.verbose
          ? entries
          : entries.map((entry) => ({
              ...entry,
              entry_values: entry.entry_values
                ? compactRecordValues(entry.entry_values, {
                    verbose: false,
                    includeTestAttributes: false,
                  })
                : entry.entry_values,
            }));

        if (options.format === 'table') {
          const tableData = displayEntries.map((e) => ({
            entry_id: e.id.entry_id,
            parent_record_id: e.parent_record_id,
            ...flattenAttributes(e.entry_values),
            created_at: new Date(e.created_at).toISOString(),
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayEntries));
        } else {
          console.log(formatJson(displayEntries));
        }
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('get')
    .description('Get a specific list entry')
    .argument('<list-slug>', 'List slug or ID')
    .argument('<entry-id>', 'Entry ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (listSlug: string, entryId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);
        const entryData = await listApi.getEntry(listSlug, entryId);

        // Apply compact formatting unless verbose mode is enabled
        const displayEntry = options.verbose
          ? entryData
          : {
              ...entryData,
              entry_values: entryData.entry_values
                ? compactRecordValues(entryData.entry_values, {
                    verbose: false,
                    includeTestAttributes: false,
                  })
                : entryData.entry_values,
            };

        if (options.format === 'table') {
          const tableData = {
            entry_id: displayEntry.id.entry_id,
            parent_record_id: displayEntry.parent_record_id,
            ...flattenAttributes(displayEntry.entry_values),
            created_at: new Date(displayEntry.created_at).toISOString(),
          };
          console.log(formatGenericTable([tableData]));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayEntry));
        } else {
          console.log(formatJson(displayEntry));
        }
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('create')
    .description('Create a new list entry')
    .argument('<list-slug>', 'List slug or ID')
    .requiredOption('--parent-record-id <id>', 'Parent record ID')
    .requiredOption(
      '--parent-object <object>',
      'Parent object slug (e.g., people, companies)'
    )
    .option(
      '--data <json>',
      'Entry attribute values as JSON (e.g., \'{"status":"active"}\')'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        // Parse entry values if provided
        let entryValues: Record<string, unknown> = {};
        if (options.data) {
          try {
            entryValues = JSON.parse(options.data);
          } catch (error) {
            console.error('Error: Invalid JSON in --data option');
            console.error('Example: --data \'{"status":"active"}\'');
            process.exit(1);
          }
        }

        const entryData = await listApi.createEntry(listSlug, {
          data: {
            parent_record_id: options.parentRecordId,
            parent_object: options.parentObject,
            entry_values: entryValues,
          },
        });

        // Apply compact formatting unless verbose mode is enabled
        const displayEntry = options.verbose
          ? entryData
          : {
              ...entryData,
              entry_values: entryData.entry_values
                ? compactRecordValues(entryData.entry_values, {
                    verbose: false,
                    includeTestAttributes: false,
                  })
                : entryData.entry_values,
            };

        if (options.format === 'table') {
          const tableData = {
            entry_id: displayEntry.id.entry_id,
            parent_record_id: displayEntry.parent_record_id,
            ...flattenAttributes(displayEntry.entry_values),
            created_at: new Date(displayEntry.created_at).toISOString(),
          };
          console.log(formatGenericTable([tableData]));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayEntry));
        } else {
          console.log(formatJson(displayEntry));
        }
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('update')
    .description('Update a list entry (appends to multiselect attributes)')
    .argument('<list-slug>', 'List slug or ID')
    .argument('<entry-id>', 'Entry ID')
    .requiredOption('--data <json>', 'Entry data to update as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (listSlug: string, entryId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        let entryValues;
        try {
          entryValues = JSON.parse(options.data);
        } catch (error) {
          console.error('Error: Invalid JSON in --data option');
          console.error('Example: --data \'{"status":"completed"}\'');
          process.exit(1);
        }

        const entryData = await listApi.updateEntry(listSlug, entryId, {
          data: { entry_values: entryValues },
        });

        // Apply compact formatting unless verbose mode is enabled
        const displayEntry = options.verbose
          ? entryData
          : {
              ...entryData,
              entry_values: entryData.entry_values
                ? compactRecordValues(entryData.entry_values, {
                    verbose: false,
                    includeTestAttributes: false,
                  })
                : entryData.entry_values,
            };

        if (options.format === 'table') {
          const tableData = {
            entry_id: displayEntry.id.entry_id,
            parent_record_id: displayEntry.parent_record_id,
            ...flattenAttributes(displayEntry.entry_values),
            created_at: new Date(displayEntry.created_at).toISOString(),
          };
          console.log(formatGenericTable([tableData]));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayEntry));
        } else {
          console.log(formatJson(displayEntry));
        }
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('delete')
    .description('Delete a list entry')
    .argument('<list-slug>', 'List slug or ID')
    .argument('<entry-id>', 'Entry ID')
    .action(async (listSlug: string, entryId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);
        await listApi.deleteEntry(listSlug, entryId);
        console.log(
          `Entry ${entryId} deleted successfully from list ${listSlug}`
        );
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('assert')
    .description('Assert (upsert) a list entry - overwrites all values')
    .argument('<list-slug>', 'List slug or ID')
    .requiredOption(
      '--data <json>',
      'Entry data as JSON (must include entry_values)'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (listSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const listApi = new ListEndpoints(client);

        let data;
        try {
          data = JSON.parse(options.data);
        } catch (error) {
          console.error('Error: Invalid JSON in --data option');
          process.exit(1);
        }

        // Validate required fields
        if (!data.entry_values) {
          console.error('Error: --data must include "entry_values" property');
          console.error(
            'Example: --data \'{"parent_record_id":"xyz","entry_values":{"status":"active"}}\''
          );
          process.exit(1);
        }

        const entryData = await listApi.assertEntry(listSlug, { data });

        // Apply compact formatting unless verbose mode is enabled
        const displayEntry = options.verbose
          ? entryData
          : {
              ...entryData,
              entry_values: entryData.entry_values
                ? compactRecordValues(entryData.entry_values, {
                    verbose: false,
                    includeTestAttributes: false,
                  })
                : entryData.entry_values,
            };

        if (options.format === 'table') {
          const tableData = {
            entry_id: displayEntry.id.entry_id,
            parent_record_id: displayEntry.parent_record_id,
            ...flattenAttributes(displayEntry.entry_values),
            created_at: new Date(displayEntry.created_at).toISOString(),
          };
          console.log(formatGenericTable([tableData]));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayEntry));
        } else {
          console.log(formatJson(displayEntry));
        }
      } catch (error) {
        reportError(error);
      }
    });

  entry
    .command('attribute-values')
    .description(
      'List attribute values for an entry (including historic values)'
    )
    .argument('<list-slug>', 'List slug or ID')
    .argument('<entry-id>', 'Entry ID')
    .argument('<attribute-slug>', 'Attribute slug')
    .option('--show-historic', 'Include historic values')
    .option('--limit <number>', 'Maximum values to return', parseInt)
    .option('--offset <number>', 'Number of values to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        listSlug: string,
        entryId: string,
        attributeSlug: string,
        options
      ) => {
        try {
          const client = new AttioClient(options.apiKey);
          const listApi = new ListEndpoints(client);

          const values = await listApi.listEntryAttributeValues(
            listSlug,
            entryId,
            attributeSlug,
            {
              show_historic: options.showHistoric,
              limit: options.limit,
              offset: options.offset,
            }
          );

          if (options.format === 'table') {
            const tableData = values.map((v) => ({
              attribute_type: v.attribute_type || '',
              value: v.value === undefined ? '' : JSON.stringify(v.value),
              active_from: v.active_from || 'N/A',
              active_until: v.active_until || 'N/A',
            }));
            console.log(formatGenericTable(tableData));
          } else if (options.format === 'csv') {
            console.log(formatCsv(values));
          } else {
            console.log(formatJson(values));
          }
        } catch (error) {
          reportError(error);
        }
      }
    );

  return entry;
}

// Helper to flatten entry attribute values for display in tables
// Note: Values should already be compacted via compactRecordValues before calling this
function flattenAttributes(
  attrs?: Record<string, unknown>
): Record<string, string> {
  if (!attrs) return {};
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) {
      // Null values (from empty attributes) → display as empty string
      flattened[key] = '';
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      // Primitive values → convert to string
      flattened[key] = String(value);
    } else if (Array.isArray(value)) {
      // Arrays → join with commas for readability
      flattened[key] = value.map((v) => String(v)).join(', ');
    } else if (typeof value === 'object') {
      // Objects → stringify
      flattened[key] = JSON.stringify(value);
    } else {
      // Fallback
      flattened[key] = String(value);
    }
  }

  return flattened;
}
