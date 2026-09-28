import { describe, it, expect } from 'vitest';
import { compactRecordValues } from '../../src/utils/compact-formatter';

describe('compactRecordValues', () => {
  describe('verbose mode', () => {
    it('should return original values when verbose is true', () => {
      const values = {
        name: [
          {
            first_name: 'John',
            last_name: 'Doe',
            full_name: 'John Doe',
            attribute_type: 'personal-name',
            active_from: '2024-01-01T00:00:00Z',
            created_by_actor: { type: 'user', id: '123' },
          },
        ],
      };

      const result = compactRecordValues(values, { verbose: true });
      expect(result).toEqual(values);
    });
  });

  describe('test attribute filtering', () => {
    it('should filter out attributes starting with "test_" by default', () => {
      const values = {
        name: [{ value: 'John', attribute_type: 'text' }],
        test_attr_123: [{ value: 'test', attribute_type: 'text' }],
        test_select_456: [
          { option: { title: 'Option' }, attribute_type: 'select' },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        name: 'John',
      });
      expect(result).not.toHaveProperty('test_attr_123');
      expect(result).not.toHaveProperty('test_select_456');
    });

    it('should include test attributes when includeTestAttributes is true', () => {
      const values = {
        name: [{ value: 'John', attribute_type: 'text' }],
        test_attr_123: [{ value: 'test', attribute_type: 'text' }],
      };

      const result = compactRecordValues(values, {
        includeTestAttributes: true,
      });
      expect(result).toEqual({
        name: 'John',
        test_attr_123: 'test',
      });
    });
  });

  describe('empty values', () => {
    it('should convert empty arrays to null', () => {
      const values = {
        name: [],
        email: [],
        tags: [],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        name: null,
        email: null,
        tags: null,
      });
    });

    it('should show null for attributes with no valid values after extraction', () => {
      const values = {
        name: [null, undefined],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        name: null,
      });
    });
  });

  describe('single vs multiple values', () => {
    it('should unwrap single values from arrays', () => {
      const values = {
        name: [{ value: 'John Doe', attribute_type: 'text' }],
        twitter: [{ value: 'https://x.com/user', attribute_type: 'text' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        name: 'John Doe',
        twitter: 'https://x.com/user',
      });
    });

    it('should keep arrays for multiple values', () => {
      const values = {
        email_addresses: [
          {
            email_address: 'user1@example.com',
            attribute_type: 'email-address',
          },
          {
            email_address: 'user2@example.com',
            attribute_type: 'email-address',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        email_addresses: ['user1@example.com', 'user2@example.com'],
      });
    });
  });

  describe('text type', () => {
    it('should extract value from text attribute', () => {
      const values = {
        description: [
          {
            value: 'This is a description',
            attribute_type: 'text',
            active_from: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        description: 'This is a description',
      });
    });
  });

  describe('number type', () => {
    it('should extract value from number attribute', () => {
      const values = {
        age: [{ value: 42, attribute_type: 'number' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ age: 42 });
    });
  });

  describe('currency type', () => {
    it('should extract simple currency value', () => {
      const values = {
        amount: [{ value: 100, attribute_type: 'currency' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ amount: 100 });
    });

    it('should extract currency object with amount and currency code', () => {
      const values = {
        price: [
          {
            value: { amount: 999, currency_code: 'USD' },
            attribute_type: 'currency',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        price: { amount: 999, currency_code: 'USD' },
      });
    });
  });

  describe('checkbox type', () => {
    it('should extract boolean value from checkbox', () => {
      const values = {
        is_active: [{ value: true, attribute_type: 'checkbox' }],
        is_archived: [{ value: false, attribute_type: 'checkbox' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        is_active: true,
        is_archived: false,
      });
    });
  });

  describe('date and timestamp types', () => {
    it('should extract date value', () => {
      const values = {
        birth_date: [{ value: '1990-01-15', attribute_type: 'date' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ birth_date: '1990-01-15' });
    });

    it('should extract timestamp value', () => {
      const values = {
        created_at: [
          {
            value: '2024-01-15T10:30:00Z',
            attribute_type: 'timestamp',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ created_at: '2024-01-15T10:30:00Z' });
    });
  });

  describe('rating type', () => {
    it('should extract rating value', () => {
      const values = {
        satisfaction: [{ value: 5, attribute_type: 'rating' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ satisfaction: 5 });
    });
  });

  describe('domain type', () => {
    it('should extract domain value', () => {
      const values = {
        website: [{ value: 'example.com', attribute_type: 'domain' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ website: 'example.com' });
    });
  });

  describe('personal-name type', () => {
    it('should extract full_name when available', () => {
      const values = {
        name: [
          {
            first_name: 'Michael',
            last_name: 'Fröhlich',
            full_name: 'Michael Fröhlich',
            attribute_type: 'personal-name',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ name: 'Michael Fröhlich' });
    });

    it('should construct name from first_name and last_name when full_name is missing', () => {
      const values = {
        name: [
          {
            first_name: 'John',
            last_name: 'Doe',
            attribute_type: 'personal-name',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ name: 'John Doe' });
    });

    it('should handle only first_name', () => {
      const values = {
        name: [
          {
            first_name: 'Madonna',
            attribute_type: 'personal-name',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ name: 'Madonna' });
    });

    it('should return null for empty personal-name', () => {
      const values = {
        name: [{ attribute_type: 'personal-name' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ name: null });
    });
  });

  describe('email-address type', () => {
    it('should extract email_address', () => {
      const values = {
        email: [
          {
            email_address: 'm.froehlich1994@gmail.com',
            email_domain: 'gmail.com',
            attribute_type: 'email-address',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ email: 'm.froehlich1994@gmail.com' });
    });

    it('should handle multiple email addresses', () => {
      const values = {
        email_addresses: [
          {
            email_address: 'user1@example.com',
            attribute_type: 'email-address',
          },
          {
            email_address: 'user2@example.com',
            attribute_type: 'email-address',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        email_addresses: ['user1@example.com', 'user2@example.com'],
      });
    });
  });

  describe('phone-number type', () => {
    it('should extract phone_number', () => {
      const values = {
        phone: [
          {
            phone_number: '+1234567890',
            country_code: 'US',
            attribute_type: 'phone-number',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ phone: '+1234567890' });
    });
  });

  describe('location type', () => {
    it('should format location from locality, region, and country_code', () => {
      const values = {
        location: [
          {
            locality: 'Munich',
            region: 'Bavaria',
            country_code: 'DE',
            attribute_type: 'location',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ location: 'Munich, Bavaria, DE' });
    });

    it('should handle partial location data', () => {
      const values = {
        location: [
          {
            locality: 'San Francisco',
            country_code: 'US',
            attribute_type: 'location',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ location: 'San Francisco, US' });
    });

    it('should return null for empty location', () => {
      const values = {
        location: [{ attribute_type: 'location' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ location: null });
    });
  });

  describe('select type', () => {
    it('should extract option title', () => {
      const values = {
        key_account: [
          {
            option: {
              id: { option_id: '123' },
              title: 'CDTM',
              is_archived: false,
            },
            attribute_type: 'select',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ key_account: 'CDTM' });
    });

    it('should return null for select with no option', () => {
      const values = {
        category: [{ attribute_type: 'select' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ category: null });
    });
  });

  describe('multiselect type', () => {
    it('should extract option titles', () => {
      const values = {
        tags: [
          {
            option: { title: 'Tag1' },
            attribute_type: 'multiselect',
          },
          {
            option: { title: 'Tag2' },
            attribute_type: 'multiselect',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ tags: ['Tag1', 'Tag2'] });
    });
  });

  describe('status type', () => {
    it('should extract status title', () => {
      const values = {
        status: [
          {
            status: {
              title: 'Active',
              is_archived: false,
            },
            attribute_type: 'status',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ status: 'Active' });
    });

    it('should return null for status with no status object', () => {
      const values = {
        status: [{ attribute_type: 'status' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ status: null });
    });
  });

  describe('actor-reference type', () => {
    it('should extract referenced_actor_type', () => {
      const values = {
        created_by: [
          {
            referenced_actor_type: 'workspace-member',
            referenced_actor_id: '456',
            attribute_type: 'actor-reference',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ created_by: 'workspace-member' });
    });

    it('should fallback to referenced_actor_id if type not available', () => {
      const values = {
        created_by: [
          {
            referenced_actor_id: '456',
            attribute_type: 'actor-reference',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ created_by: '456' });
    });
  });

  describe('record-reference type', () => {
    it('should extract target_record_id', () => {
      const values = {
        company: [
          {
            target_object: 'companies',
            target_record_id: '6379a0c4-f1b9-4a78-8c99-655b62afe22d',
            attribute_type: 'record-reference',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        company: '6379a0c4-f1b9-4a78-8c99-655b62afe22d',
      });
    });

    it('should handle multiple record references', () => {
      const values = {
        companies: [
          {
            target_record_id: 'id1',
            attribute_type: 'record-reference',
          },
          {
            target_record_id: 'id2',
            attribute_type: 'record-reference',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ companies: ['id1', 'id2'] });
    });
  });

  describe('interaction type', () => {
    it('should extract interaction_type', () => {
      const values = {
        last_contact: [
          {
            interaction_type: 'email',
            attribute_type: 'interaction',
          },
        ],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ last_contact: 'email' });
    });

    it('should fallback to "interaction" for generic interactions', () => {
      const values = {
        last_contact: [{ attribute_type: 'interaction' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ last_contact: 'interaction' });
    });
  });

  describe('unknown or missing type', () => {
    it('should extract .value if present', () => {
      const values = {
        custom_field: [{ value: 'custom value' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({ custom_field: 'custom value' });
    });

    it('should return object as-is if no .value', () => {
      const values = {
        custom_field: [{ custom_property: 'data' }],
      };

      const result = compactRecordValues(values);
      expect(result).toEqual({
        custom_field: { custom_property: 'data' },
      });
    });
  });

  describe('complex real-world example', () => {
    it('should handle complete record with mixed attribute types', () => {
      const values = {
        name: [
          {
            first_name: 'Michael',
            last_name: 'Fröhlich',
            full_name: 'Michael Fröhlich',
            attribute_type: 'personal-name',
            active_from: '2026-01-30T18:33:54.442000000Z',
            created_by_actor: { type: 'api-token', id: 'xyz' },
          },
        ],
        email_addresses: [
          {
            email_address: 'm.froehlich1994@gmail.com',
            email_domain: 'gmail.com',
            attribute_type: 'email-address',
            active_from: '2026-01-30T18:33:54.442000000Z',
          },
          {
            email_address: 'michael@ark-climate.de',
            email_domain: 'ark-climate.de',
            attribute_type: 'email-address',
            active_from: '2026-01-31T10:15:22.123000000Z',
          },
        ],
        instagram: [],
        description: [],
        twitter: [
          {
            value: 'https://x.com/froehlichmmm',
            attribute_type: 'text',
            active_from: '2026-01-15T14:43:24.827000000Z',
          },
        ],
        key_account: [
          {
            option: {
              id: { workspace_id: '...', option_id: '...' },
              title: 'CDTM',
              is_archived: false,
            },
            attribute_type: 'select',
            active_from: '2026-01-31T22:25:33.001000000Z',
          },
        ],
        test_attr_1770130545682: [],
        test_select_1770130546620: [],
      };

      const result = compactRecordValues(values);

      expect(result).toEqual({
        name: 'Michael Fröhlich',
        email_addresses: [
          'm.froehlich1994@gmail.com',
          'michael@ark-climate.de',
        ],
        instagram: null,
        description: null,
        twitter: 'https://x.com/froehlichmmm',
        key_account: 'CDTM',
        // test attributes should be filtered out
      });

      // Verify test attributes are not present
      expect(result).not.toHaveProperty('test_attr_1770130545682');
      expect(result).not.toHaveProperty('test_select_1770130546620');
    });
  });
});
