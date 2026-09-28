import { formatCsv } from '../formatters/csv';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';

export function present(
  data: unknown,
  format: string,
  nextCursor?: string | null
): void {
  if (nextCursor) {
    console.error(`Next cursor: ${nextCursor}`);
  }
  if (format === 'table') {
    const rows = (Array.isArray(data) ? data : [data]) as Array<
      Record<string, unknown>
    >;
    console.log(formatGenericTable(rows));
    return;
  }
  if (format === 'csv') {
    console.log(formatCsv(data));
    return;
  }
  if (format === 'json') {
    console.log(formatJson(data));
    return;
  }
  throw new Error('Format must be json, table, or csv');
}

export function readJson(raw: string, name: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON in ${name}`);
  }
}
