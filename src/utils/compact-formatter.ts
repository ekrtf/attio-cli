/**
 * Compact formatter for Attio attribute values
 *
 * This module provides utilities to extract essential data from Attio API responses,
 * removing metadata and presenting values in a clean, readable format.
 */

/**
 * Options for compact formatting
 */
export interface CompactOptions {
  /** If true, returns full API response without any transformations */
  verbose?: boolean;
  /** If true, includes attributes starting with "test_" (default: false) */
  includeTestAttributes?: boolean;
}

/**
 * Extracts compact representation from Attio attribute values
 *
 * @param values - Record values from Attio API
 * @param options - Formatting options
 * @returns Compact record with essential data only
 *
 * @example
 * const compact = compactRecordValues({
 *   name: [{
 *     first_name: "John",
 *     last_name: "Doe",
 *     full_name: "John Doe",
 *     attribute_type: "personal-name",
 *     active_from: "...",
 *     created_by_actor: {...}
 *   }],
 *   email_addresses: [],
 *   test_attr: [...]
 * }, { verbose: false, includeTestAttributes: false });
 *
 * // Result: { name: "John Doe", email_addresses: null }
 */
export function compactRecordValues(
  values: Record<string, unknown>,
  options: CompactOptions = {}
): Record<string, unknown> {
  if (options.verbose) {
    return values; // Return full API response
  }

  const compact: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    // Filter test attributes (always hide these unless explicitly included)
    if (!options.includeTestAttributes && key.startsWith('test_')) {
      continue;
    }

    // Extract compact value based on attribute type
    // Empty arrays will be converted to null (non-archived attributes with no values)
    const compactValue = extractCompactValue(value);

    // Always include the attribute, even if null (indicates empty but available)
    compact[key] = compactValue;
  }

  return compact;
}

/**
 * Extracts compact value from attribute value array
 *
 * Handles both single values and arrays:
 * - Empty arrays → null
 * - Single value → unwrapped value
 * - Multiple values → array of values
 */
function extractCompactValue(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value; // Pass through non-array values
  }

  if (value.length === 0) {
    return null; // Empty arrays become null
  }

  // Extract compact representation for each value in array
  const compactValues = value
    .map(extractSingleValue)
    .filter((v) => v !== null && v !== undefined);

  if (compactValues.length === 0) {
    return null;
  }

  // Return single value if array has only one element, otherwise return array
  return compactValues.length === 1 ? compactValues[0] : compactValues;
}

/**
 * Extracts essential data from a single attribute value based on its type
 *
 * Supports all 19 Attio attribute types:
 * - text, number, currency, rating, timestamp, date, checkbox, domain
 * - personal-name, email-address, phone-number, location
 * - select, multiselect, status
 * - actor-reference, record-reference, interaction
 */
function extractSingleValue(item: unknown): unknown {
  // Handle primitive values
  if (typeof item !== 'object' || item === null) {
    return item;
  }

  const obj = item as Record<string, unknown>;
  const type = obj.attribute_type as string | undefined;

  // If no type specified, try to extract .value or return as-is
  if (!type) {
    return obj.value !== undefined ? obj.value : obj;
  }

  switch (type) {
    // Simple value-based types - extract .value
    case 'text':
    case 'number':
    case 'rating':
    case 'timestamp':
    case 'date':
    case 'checkbox':
    case 'domain':
      return obj.value;

    // Currency - can be a simple value or object with amount/currency
    case 'currency':
      if (obj.value && typeof obj.value === 'object') {
        return obj.value; // Return currency object as-is
      }
      return obj.value;

    // Personal name - extract full_name, or construct from parts
    case 'personal-name':
      if (obj.full_name) {
        return obj.full_name;
      }
      // Fallback to constructing from first_name and last_name
      const firstName = obj.first_name as string | undefined;
      const lastName = obj.last_name as string | undefined;
      const parts = [firstName, lastName].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : null;

    // Email address - extract email_address
    case 'email-address':
      return obj.email_address || null;

    // Phone number - extract phone_number
    case 'phone-number':
      return obj.phone_number || null;

    // Location - format from locality, region, country_code
    case 'location': {
      const locationParts = [obj.locality, obj.region, obj.country_code].filter(
        Boolean
      );
      return locationParts.length > 0 ? locationParts.join(', ') : null;
    }

    // Select/Multiselect - extract option title
    case 'select':
    case 'multiselect':
      if (obj.option && typeof obj.option === 'object') {
        const option = obj.option as Record<string, unknown>;
        return option.title || null;
      }
      return null;

    // Status - extract status title
    case 'status':
      if (obj.status && typeof obj.status === 'object') {
        const status = obj.status as Record<string, unknown>;
        return status.title || null;
      }
      return null;

    // Actor reference - extract referenced_actor_type or referenced_actor_id
    case 'actor-reference':
      // Could show type or ID, or both
      return obj.referenced_actor_type || obj.referenced_actor_id || null;

    // Record reference - extract target_record_id
    case 'record-reference':
      return obj.target_record_id || null;

    // Interaction - extract interaction_type or use generic label
    case 'interaction':
      return obj.interaction_type || 'interaction';

    // Unknown type - try to extract .value or return as-is
    default:
      return obj.value !== undefined ? obj.value : obj;
  }
}
