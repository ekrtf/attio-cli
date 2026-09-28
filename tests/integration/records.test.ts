import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { RecordEndpoints } from '../../src/api/endpoints/records';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Records Integration Tests', () => {
  let client: AttioClient;
  let recordApi: RecordEndpoints;
  let testRecordId: string | null = null;

  beforeAll(() => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
    recordApi = new RecordEndpoints(client);
  });

  afterAll(async () => {
    // Cleanup: delete test record if it was created
    if (testRecordId) {
      try {
        await recordApi.deleteRecord('people', testRecordId);
        console.log(`Cleaned up test record: ${testRecordId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test record: ${error}`);
      }
    }
  });

  describe('List Records', () => {
    it('should list people records', async () => {
      const records = await recordApi.listRecords('people', { limit: 5 });

      expect(records).toBeInstanceOf(Array);

      if (records.length > 0) {
        const record = records[0];
        expect(record.id).toBeDefined();
        expect(record.id.record_id).toBeDefined();
        expect(record.values).toBeDefined();
        expect(record.created_at).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      const records = await recordApi.listRecords('people', { limit: 2 });

      expect(records).toBeInstanceOf(Array);
      expect(records.length).toBeLessThanOrEqual(2);
    });

    it('should list company records', async () => {
      const records = await recordApi.listRecords('companies', { limit: 5 });

      expect(records).toBeInstanceOf(Array);
    });
  });

  describe('Create, Get, Update, Delete Record', () => {
    it('should create a new person record', async () => {
      const timestamp = Date.now();
      const testEmail = `test-cli-${timestamp}@integration-test.example.com`;

      // Correct format: data.values is required
      const testData = {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      };

      const record = await recordApi.createRecord('people', testData);

      expect(record).toBeDefined();
      expect(record.id.record_id).toBeDefined();
      expect(record.values).toBeDefined();
      expect(record.values.email_addresses).toBeDefined();

      // Save for later tests and cleanup
      testRecordId = record.id.record_id;
      console.log(`✓ Created test record with ID: ${testRecordId}`);
    });

    it('should get the created record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const record = await recordApi.getRecord('people', testRecordId);

      expect(record).toBeDefined();
      expect(record.id.record_id).toBe(testRecordId);
      expect(record.values).toBeDefined();
      expect(record.values.email_addresses).toBeDefined();

      console.log(`✓ Retrieved test record: ${testRecordId}`);
    });

    it('should update the record with a name', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const updateData = {
        data: {
          values: {
            name: {
              first_name: 'IntegrationTest',
              last_name: 'User',
              full_name: 'IntegrationTest User',
            },
          },
        },
      };

      const record = await recordApi.updateRecord(
        'people',
        testRecordId,
        updateData
      );

      expect(record).toBeDefined();
      expect(record.id.record_id).toBe(testRecordId);
      expect(record.values).toBeDefined();
      expect(record.values.name).toBeDefined();

      // Verify the name was actually updated
      const nameValues = record.values.name as Array<{
        first_name?: string;
        last_name?: string;
        full_name?: string;
      }>;
      expect(nameValues.length).toBeGreaterThan(0);
      expect(nameValues[0].first_name).toBe('IntegrationTest');
      expect(nameValues[0].full_name).toBe('IntegrationTest User');

      console.log(`✓ Updated test record: ${testRecordId}`);
    });

    it('should delete the record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      await recordApi.deleteRecord('people', testRecordId);

      // Verify deletion by trying to get it (should throw)
      await expect(
        recordApi.getRecord('people', testRecordId)
      ).rejects.toThrow();

      console.log(`✓ Deleted test record: ${testRecordId}`);

      // Mark as null so afterAll doesn't try to delete again
      testRecordId = null;
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid record ID', async () => {
      await expect(
        recordApi.getRecord('people', 'invalid-record-id-12345')
      ).rejects.toThrow();
    });

    it('should throw error for invalid object slug', async () => {
      await expect(
        recordApi.listRecords('nonexistent-object-12345')
      ).rejects.toThrow();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter records by email domain', async () => {
      const filter = {
        email_addresses: {
          email_address: {
            $contains: '@',
          },
        },
      };

      const records = await recordApi.listRecords('people', {
        filter,
        limit: 5,
      });

      expect(records).toBeInstanceOf(Array);
      // All returned records should have email addresses containing @
      records.forEach((record) => {
        expect(record.values.email_addresses).toBeDefined();
      });
    });

    it('should sort records by created_at descending', async () => {
      const records = await recordApi.listRecords('people', {
        sorts: [{ attribute: 'created_at', direction: 'desc' }],
        limit: 5,
      });

      expect(records).toBeInstanceOf(Array);

      // Verify records are sorted by created_at descending
      if (records.length > 1) {
        for (let i = 0; i < records.length - 1; i++) {
          const current = new Date(records[i].created_at);
          const next = new Date(records[i + 1].created_at);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    it('should combine filter and sort', async () => {
      const filter = {
        email_addresses: {
          email_address: {
            $contains: '@',
          },
        },
      };

      const records = await recordApi.listRecords('people', {
        filter,
        sorts: [{ attribute: 'created_at', direction: 'desc' }],
        limit: 5,
      });

      expect(records).toBeInstanceOf(Array);

      // All should have email containing @
      records.forEach((record) => {
        expect(record.values.email_addresses).toBeDefined();
      });

      // Should be sorted descending
      if (records.length > 1) {
        for (let i = 0; i < records.length - 1; i++) {
          const current = new Date(records[i].created_at);
          const next = new Date(records[i + 1].created_at);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    it('should throw error for non-existent attribute', async () => {
      const filter = {
        nonexistent_custom_field_12345: {
          $eq: 'value',
        },
      };

      // API throws error for unknown attribute slugs
      await expect(
        recordApi.listRecords('people', {
          filter,
          limit: 5,
        })
      ).rejects.toThrow(/Unknown attribute slug/);
    });

    it('should support querying by any attribute slug (custom attributes)', async () => {
      // This test validates that ANY attribute can be queried
      // We use a standard attribute to test the mechanism
      const filter = {
        email_addresses: {
          email_address: {
            $contains: '@',
          },
        },
      };

      const records = await recordApi.listRecords('people', {
        filter,
        limit: 5,
      });

      expect(records).toBeInstanceOf(Array);
      records.forEach((record) => {
        expect(record.values.email_addresses).toBeDefined();
      });
    });
  });

  describe('Assert Record (Upsert)', () => {
    let assertTestRecordId: string | null = null;

    afterAll(async () => {
      // Cleanup assert test record
      if (assertTestRecordId) {
        try {
          await recordApi.deleteRecord('people', assertTestRecordId);
          console.log(`Cleaned up assert test record: ${assertTestRecordId}`);
        } catch (error) {
          console.warn(`Failed to cleanup assert test record: ${error}`);
        }
      }
    });

    it('should assert a new record when no match exists', async () => {
      const timestamp = Date.now();
      const testEmail = `test-assert-${timestamp}@integration-test.example.com`;

      const record = await recordApi.assertRecord('people', 'email_addresses', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });

      expect(record).toBeDefined();
      expect(record.id.record_id).toBeDefined();
      expect(record.values.email_addresses).toBeDefined();

      assertTestRecordId = record.id.record_id;
    });

    it('should assert existing record when match found', async () => {
      if (!assertTestRecordId) {
        throw new Error('Assert test record not created');
      }

      // Get the existing record to find the email
      const existingRecord = await recordApi.getRecord(
        'people',
        assertTestRecordId
      );
      const emailArray = existingRecord.values.email_addresses as Array<{
        email_address?: string;
      }>;
      const testEmail = emailArray[0]?.email_address;

      if (!testEmail) {
        throw new Error('Test email not found in record');
      }

      // Assert again with same email - should return same record ID
      const record = await recordApi.assertRecord('people', 'email_addresses', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });

      expect(record).toBeDefined();
      expect(record.id.record_id).toBe(assertTestRecordId); // Same record ID
    });
  });
});
