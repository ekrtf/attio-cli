import { describe, it, expect } from 'vitest';
import {
  filterByAttribute,
  filterContains,
  filterEquals,
  FILTER_OPERATORS,
  EXAMPLE_FILTERS,
  EXAMPLE_SORTS,
} from '../../../src/utils/query-helpers';

describe('Query Helpers', () => {
  describe('filterByAttribute', () => {
    it('should build a filter for an attribute', () => {
      const result = filterByAttribute('email_addresses', {
        email_address: { $eq: 'test@example.com' },
      });

      expect(result).toEqual({
        email_addresses: {
          email_address: { $eq: 'test@example.com' },
        },
      });
    });
  });

  describe('filterContains', () => {
    it('should build a contains filter', () => {
      const result = filterContains(
        'email_addresses',
        'email_address',
        '@example.com'
      );

      expect(result).toEqual({
        email_addresses: {
          email_address: {
            $contains: '@example.com',
          },
        },
      });
    });

    it('should work with custom attributes', () => {
      const result = filterContains('custom_notes_field', 'value', 'important');

      expect(result).toEqual({
        custom_notes_field: {
          value: {
            $contains: 'important',
          },
        },
      });
    });
  });

  describe('filterEquals', () => {
    it('should build an equality filter', () => {
      const result = filterEquals('name', 'first_name', 'John');

      expect(result).toEqual({
        name: {
          first_name: {
            $eq: 'John',
          },
        },
      });
    });

    it('should work with custom attributes', () => {
      const result = filterEquals('custom_status', 'value', 'active');

      expect(result).toEqual({
        custom_status: {
          value: {
            $eq: 'active',
          },
        },
      });
    });
  });

  describe('FILTER_OPERATORS', () => {
    it('should define all supported operators', () => {
      expect(FILTER_OPERATORS.$eq).toBe('Equals');
      expect(FILTER_OPERATORS.$contains).toBe('Contains substring');
      expect(FILTER_OPERATORS.$starts_with).toBe('Starts with');
      expect(FILTER_OPERATORS.$ends_with).toBe('Ends with');
    });
  });

  describe('EXAMPLE_FILTERS', () => {
    it('should provide example filters', () => {
      expect(EXAMPLE_FILTERS.people_by_email_domain).toBeDefined();
      expect(EXAMPLE_FILTERS.people_by_exact_email).toBeDefined();
      expect(EXAMPLE_FILTERS.people_by_company).toBeDefined();
      expect(EXAMPLE_FILTERS.people_by_custom_status).toBeDefined();
    });

    it('should have valid filter structure', () => {
      const filter = EXAMPLE_FILTERS.people_by_email_domain;
      expect(filter).toHaveProperty('email_addresses');
      expect(filter.email_addresses).toHaveProperty('email_address');
      expect(
        (filter.email_addresses as Record<string, unknown>).email_address
      ).toHaveProperty('$contains');
    });
  });

  describe('EXAMPLE_SORTS', () => {
    it('should provide example sorts', () => {
      expect(EXAMPLE_SORTS.newest_first).toBeDefined();
      expect(EXAMPLE_SORTS.oldest_first).toBeDefined();
      expect(EXAMPLE_SORTS.by_name_asc).toBeDefined();
    });

    it('should have valid sort structure', () => {
      const sort = EXAMPLE_SORTS.newest_first;
      expect(Array.isArray(sort)).toBe(true);
      expect(sort[0]).toHaveProperty('attribute');
      expect(sort[0]).toHaveProperty('direction');
      expect(sort[0].direction).toBe('desc');
    });
  });
});
