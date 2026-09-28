import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { RecordEndpoints } from '../api/endpoints/records';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { validateFilterStructure } from '../utils/filter-validator';
import { compactRecordValues } from '../utils/compact-formatter';
import { reportError } from '../utils/cli-error';
import { present, readJson } from './present';

export function createRecordCommand(): Command {
  const record = new Command('record').description(
    'Manage records (people, companies, deals)'
  );

  // List records
  record
    .command('list')
    .description('List records for an object')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .option('--limit <number>', 'Maximum records to return', parseInt)
    .option('--offset <number>', 'Number of records to skip', parseInt)
    .option(
      '--filter <json>',
      'Filter query as JSON (e.g., \'{"email_addresses":{"email_address":{"$contains":"@example.com"}}}\')'
    )
    .option(
      '--sort <json>',
      'Sort specification as JSON (e.g., \'[{"attribute":"name","direction":"asc"}]\')'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

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
                '\nExample: --filter \'{"email_addresses":{"email_address":{"$eq":"user@example.com"}}}\''
              );
              process.exit(1);
            }
          } catch (error) {
            console.error('Error: Invalid JSON in --filter option');
            console.error(
              'Example: --filter \'{"email_addresses":{"email_address":{"$eq":"user@example.com"}}}\''
            );
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
              'Example: --sort \'[{"attribute":"name","direction":"asc"}]\''
            );
            process.exit(1);
          }
        }

        const records = await recordApi.listRecords(objectSlug, {
          limit: options.limit,
          offset: options.offset,
          filter: filter,
          sorts: sorts,
        });

        // Apply compact formatting unless verbose mode is enabled
        const displayRecords = options.verbose
          ? records
          : records.map((rec) => ({
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            }));

        if (options.format === 'table') {
          const tableData = displayRecords.map((rec) => ({
            record_id: rec.id.record_id,
            ...flattenValues(rec.values),
            created_at: new Date(rec.created_at).toISOString(),
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayRecords));
        } else {
          console.log(formatJson(displayRecords));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Get record
  record
    .command('get')
    .description('Get a specific record')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .argument('<record-id>', 'Record ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, recordId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

        const rec = await recordApi.getRecord(objectSlug, recordId);

        // Apply compact formatting unless verbose mode is enabled
        const displayRecord = options.verbose
          ? rec
          : {
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            };

        if (options.format === 'table') {
          const tableData = [
            {
              record_id: displayRecord.id.record_id,
              ...flattenValues(displayRecord.values),
              created_at: new Date(displayRecord.created_at).toISOString(),
            },
          ];
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayRecord));
        } else {
          console.log(formatJson(displayRecord));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Create record
  record
    .command('create')
    .description('Create a new record')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .requiredOption('--data <json>', 'Record data as JSON string')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

        const data = JSON.parse(options.data);
        const rec = await recordApi.createRecord(objectSlug, { data });

        // Apply compact formatting unless verbose mode is enabled
        const displayRecord = options.verbose
          ? rec
          : {
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            };

        if (options.format === 'table') {
          const tableData = [
            {
              record_id: displayRecord.id.record_id,
              ...flattenValues(displayRecord.values),
              created_at: new Date(displayRecord.created_at).toISOString(),
            },
          ];
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayRecord));
        } else {
          console.log(formatJson(displayRecord));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Update record
  record
    .command('update')
    .description('Update an existing record')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .argument('<record-id>', 'Record ID')
    .requiredOption('--data <json>', 'Updated data as JSON string')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, recordId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

        const data = JSON.parse(options.data);
        const rec = await recordApi.updateRecord(objectSlug, recordId, {
          data,
        });

        // Apply compact formatting unless verbose mode is enabled
        const displayRecord = options.verbose
          ? rec
          : {
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            };

        if (options.format === 'table') {
          const tableData = [
            {
              record_id: displayRecord.id.record_id,
              ...flattenValues(displayRecord.values),
              created_at: new Date(displayRecord.created_at).toISOString(),
            },
          ];
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayRecord));
        } else {
          console.log(formatJson(displayRecord));
        }
      } catch (error) {
        reportError(error);
      }
    });

  record
    .command('values')
    .description('List the value history of one attribute')
    .argument('<object>', 'Object slug')
    .argument('<record-id>', 'Record ID')
    .argument('<attribute>', 'Attribute slug or ID')
    .option('--show-historic', 'Include historic values')
    .option('--limit <number>', 'Maximum values to return', parseInt)
    .option('--offset <number>', 'Number of values to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        objectSlug: string,
        recordId: string,
        attribute: string,
        options
      ) => {
        try {
          const client = new AttioClient(options.apiKey);
          const recordApi = new RecordEndpoints(client);
          const values = await recordApi.listAttributeValues(
            objectSlug,
            recordId,
            attribute,
            {
              showHistoric: options.showHistoric,
              limit: options.limit,
              offset: options.offset,
            }
          );
          present(values, options.format);
        } catch (error) {
          reportError(error);
        }
      }
    );

  record
    .command('set-values')
    .description('Write the value history of one attribute')
    .argument('<object>', 'Object slug')
    .argument('<record-id>', 'Record ID')
    .argument('<attribute>', 'Attribute slug or ID')
    .requiredOption(
      '--data <json>',
      'JSON array of {value, active_from, active_until}'
    )
    .option(
      '--replace-history',
      'Replace existing history instead of appending'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(
      async (
        objectSlug: string,
        recordId: string,
        attribute: string,
        options
      ) => {
        try {
          const values = readJson(options.data, '--data');
          if (!Array.isArray(values)) {
            throw new Error('--data must be a JSON array');
          }
          const client = new AttioClient(options.apiKey);
          const recordApi = new RecordEndpoints(client);
          const written = await recordApi.setAttributeValues(
            objectSlug,
            recordId,
            attribute,
            {
              data: {
                values,
                replace_history: Boolean(options.replaceHistory),
              },
            }
          );
          present(written, options.format);
        } catch (error) {
          reportError(error);
        }
      }
    );

  record
    .command('replace')
    .description("Replace a record's attribute values")
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .argument('<record-id>', 'Record ID')
    .requiredOption('--data <json>', 'Attribute values object as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, recordId: string, options) => {
      try {
        const values = readJson(options.data, '--data');
        if (
          typeof values !== 'object' ||
          values === null ||
          Array.isArray(values)
        ) {
          throw new Error('--data must be a JSON object of attribute values');
        }
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);
        const rec = await recordApi.replaceRecord(objectSlug, recordId, {
          data: { values: values as Record<string, unknown> },
        });
        const displayRecord = options.verbose
          ? rec
          : {
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            };
        present(displayRecord, options.format);
      } catch (error) {
        reportError(error);
      }
    });

  // Delete record
  record
    .command('delete')
    .description('Delete a record')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .argument('<record-id>', 'Record ID')
    .action(async (objectSlug: string, recordId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

        await recordApi.deleteRecord(objectSlug, recordId);
        console.log(`Record ${recordId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  record
    .command('assert')
    .description('Assert (upsert) a record using matching attribute')
    .argument('<object>', 'Object slug (e.g., people, companies, deals)')
    .requiredOption(
      '--matching-attribute <slug>',
      'Attribute to match on (e.g., email_addresses)'
    )
    .requiredOption('--data <json>', 'Record data as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .option('--verbose', 'Show full API response with metadata')
    .action(async (objectSlug: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const recordApi = new RecordEndpoints(client);

        let data;
        try {
          data = JSON.parse(options.data);
        } catch (error) {
          console.error('Error: Invalid JSON in --data option');
          console.error(
            'Example: --data \'{"email_addresses":[{"email_address":"test@example.com"}]}\''
          );
          process.exit(1);
        }

        const rec = await recordApi.assertRecord(
          objectSlug,
          options.matchingAttribute,
          { data }
        );

        // Apply compact formatting unless verbose mode is enabled
        const displayRecord = options.verbose
          ? rec
          : {
              ...rec,
              values: compactRecordValues(rec.values, {
                verbose: false,
                includeTestAttributes: false,
              }),
            };

        if (options.format === 'table') {
          const tableData = {
            record_id: displayRecord.id.record_id,
            object_id: displayRecord.id.object_id,
            ...flattenValues(displayRecord.values),
            created_at: new Date(displayRecord.created_at).toISOString(),
          };
          console.log(formatGenericTable([tableData]));
        } else if (options.format === 'csv') {
          console.log(formatCsv(displayRecord));
        } else {
          console.log(formatJson(displayRecord));
        }
      } catch (error) {
        reportError(error);
      }
    });

  return record;
}

// Helper to flatten record values for display in tables
// Note: Values should already be compacted via compactRecordValues before calling this
function flattenValues(
  values: Record<string, unknown>
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
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
