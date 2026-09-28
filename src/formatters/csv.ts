import { stringify } from 'csv-stringify/sync';
import { neutralizeSpreadsheetFormula } from '../utils/terminal';

export function formatCsv(data: unknown): string {
  let arrayData: unknown[];

  if (!Array.isArray(data)) {
    // Convert single object to array
    arrayData = [data];
  } else {
    arrayData = data;
  }

  if (arrayData.length === 0) {
    return '';
  }

  // Flatten nested objects
  const flattenedData = arrayData.map((item) =>
    flattenObject(item as Record<string, unknown>)
  );

  // Generate CSV with headers
  const csv = stringify(flattenedData, {
    header: true,
    quoted: true,
  });

  return csv;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenObject(value as Record<string, unknown>, newKey)
      );
    } else if (Array.isArray(value)) {
      flattened[newKey] = neutralizeSpreadsheetFormula(
        value
          .map((item) =>
            typeof item === 'object' ? JSON.stringify(item) : String(item)
          )
          .join('; ')
      );
    } else {
      flattened[newKey] = neutralizeSpreadsheetFormula(String(value));
    }
  }

  return flattened;
}
