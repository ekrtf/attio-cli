export interface FilterValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates basic filter structure.
 * Attio accepts implicit equality (`{ "name": "Ada" }`) as well as `$` operators.
 */
export function validateFilterStructure(
  filter: unknown
): FilterValidationResult {
  const errors: string[] = [];

  if (typeof filter !== 'object' || filter === null) {
    errors.push('Filter must be an object');
    return { valid: false, errors };
  }

  // Check for common mistakes
  const filterObj = filter as Record<string, unknown>;

  for (const [attributeSlug, attributeFilter] of Object.entries(filterObj)) {
    if (
      attributeSlug === '$and' ||
      attributeSlug === '$or' ||
      attributeSlug === '$not'
    ) {
      continue;
    }

    if (attributeFilter === null) {
      errors.push(`Filter for attribute "${attributeSlug}" must not be null`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
