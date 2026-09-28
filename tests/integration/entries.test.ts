import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { ListEndpoints } from '../../src/api/endpoints/lists';
import { RecordEndpoints } from '../../src/api/endpoints/records';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Entries Integration Tests', () => {
  let client: AttioClient;
  let listApi: ListEndpoints;
  let recordApi: RecordEndpoints;
  let testRecordId: string | null = null;
  let testListSlug: string | null = null;
  let testEntryId: string | null = null;

  beforeAll(async () => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
    listApi = new ListEndpoints(client);
    recordApi = new RecordEndpoints(client);

    // Find first available list for testing
    const lists = await listApi.listLists({ limit: 1 });
    if (lists.length === 0) {
      throw new Error('No lists available for testing');
    }
    testListSlug = lists[0].api_slug;
  });

  afterAll(async () => {
    // Cleanup in reverse order: entry -> record
    if (testEntryId && testListSlug) {
      try {
        await listApi.deleteEntry(testListSlug, testEntryId);
        console.log(`Cleaned up test entry: ${testEntryId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test entry: ${error}`);
      }
    }

    if (testRecordId) {
      try {
        await recordApi.deleteRecord('people', testRecordId);
        console.log(`Cleaned up test record: ${testRecordId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test record: ${error}`);
      }
    }
  });

  describe('List Entries', () => {
    it('should list entries in a list', async () => {
      if (!testListSlug) {
        throw new Error('No test list available');
      }

      const entries = await listApi.listEntries(testListSlug, { limit: 5 });

      expect(entries).toBeInstanceOf(Array);

      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry.id).toBeDefined();
        expect(entry.id.entry_id).toBeDefined();
        expect(entry.parent_record_id).toBeDefined();
        expect(entry.created_at).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      if (!testListSlug) {
        throw new Error('No test list available');
      }

      const entries = await listApi.listEntries(testListSlug, { limit: 2 });

      expect(entries).toBeInstanceOf(Array);
      expect(entries.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Create, Get, Update, Delete Entry', () => {
    it('should create a test person record for entries', async () => {
      const timestamp = Date.now();
      const testEmail = `test-entries-${timestamp}@integration-test.example.com`;

      const testData = {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      };

      const record = await recordApi.createRecord('people', testData);

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.id.record_id).toBeDefined();

      testRecordId = record.id.record_id;
    });

    it('should create a new entry', async () => {
      if (!testListSlug || !testRecordId) {
        throw new Error('Test prerequisites not met');
      }

      const entry = await listApi.createEntry(testListSlug, {
        data: {
          parent_record_id: testRecordId,
          parent_object: 'people',
          entry_values: {},
        },
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.id.entry_id).toBeDefined();
      expect(entry.parent_record_id).toBe(testRecordId);

      testEntryId = entry.id.entry_id;
    });

    it('should get the created entry', async () => {
      if (!testListSlug || !testEntryId) {
        throw new Error('Test prerequisites not met');
      }

      const entry = await listApi.getEntry(testListSlug, testEntryId);

      expect(entry).toBeDefined();
      expect(entry.id.entry_id).toBe(testEntryId);
      expect(entry.parent_record_id).toBe(testRecordId);
    });

    it('should update the entry', async () => {
      if (!testListSlug || !testEntryId) {
        throw new Error('Test prerequisites not met');
      }

      // Get the list to find available attributes
      const list = await listApi.getList(testListSlug);

      // Try to update - note: actual updateable attributes depend on the list schema
      const updatedEntry = await listApi.updateEntry(
        testListSlug,
        testEntryId,
        {
          data: { entry_values: {} },
        }
      );

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry.id.entry_id).toBe(testEntryId);
    });

    it('should delete the entry', async () => {
      if (!testListSlug || !testEntryId) {
        throw new Error('Test prerequisites not met');
      }

      await listApi.deleteEntry(testListSlug, testEntryId);

      // Verify deletion by trying to get the entry (should throw)
      await expect(
        listApi.getEntry(testListSlug, testEntryId)
      ).rejects.toThrow();

      testEntryId = null; // Prevent double deletion in afterAll
    });

    it('should delete the test record', async () => {
      if (!testRecordId) {
        throw new Error('Test record not created');
      }

      await recordApi.deleteRecord('people', testRecordId);

      // Verify deletion by trying to get the record (should throw)
      await expect(
        recordApi.getRecord('people', testRecordId)
      ).rejects.toThrow();

      testRecordId = null; // Prevent double deletion in afterAll
    });
  });

  describe('Assert Entry (Upsert)', () => {
    let assertTestRecordId: string | null = null;
    let assertTestEntryId: string | null = null;

    afterAll(async () => {
      // Cleanup assert test data
      if (assertTestEntryId && testListSlug) {
        try {
          await listApi.deleteEntry(testListSlug, assertTestEntryId);
          console.log(`Cleaned up assert test entry: ${assertTestEntryId}`);
        } catch (error) {
          console.warn(`Failed to cleanup assert test entry: ${error}`);
        }
      }

      if (assertTestRecordId) {
        try {
          await recordApi.deleteRecord('people', assertTestRecordId);
          console.log(`Cleaned up assert test record: ${assertTestRecordId}`);
        } catch (error) {
          console.warn(`Failed to cleanup assert test record: ${error}`);
        }
      }
    });

    it('should create a test record for assert operations', async () => {
      const timestamp = Date.now();
      const testEmail = `test-assert-${timestamp}@integration-test.example.com`;

      const record = await recordApi.createRecord('people', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });

      assertTestRecordId = record.id.record_id;
      expect(assertTestRecordId).toBeDefined();
    });

    it('should assert a new entry when no match exists', async () => {
      if (!testListSlug || !assertTestRecordId) {
        throw new Error('Test prerequisites not met');
      }

      const entry = await listApi.assertEntry(testListSlug, {
        data: {
          parent_record_id: assertTestRecordId,
          parent_object: 'people',
          entry_values: {},
        },
      });

      expect(entry).toBeDefined();
      expect(entry.id.entry_id).toBeDefined();
      expect(entry.parent_record_id).toBe(assertTestRecordId);

      assertTestEntryId = entry.id.entry_id;
    });

    it('should assert existing entry when match found', async () => {
      if (!testListSlug || !assertTestRecordId || !assertTestEntryId) {
        throw new Error('Test prerequisites not met');
      }

      // Assert again with same parent record - should update existing entry
      const entry = await listApi.assertEntry(testListSlug, {
        data: {
          parent_record_id: assertTestRecordId,
          parent_object: 'people',
          entry_values: {},
        },
      });

      expect(entry).toBeDefined();
      expect(entry.id.entry_id).toBe(assertTestEntryId); // Same entry ID
      expect(entry.parent_record_id).toBe(assertTestRecordId);
    });
  });

  describe('Entry Attribute Values', () => {
    let attrTestRecordId: string | null = null;
    let attrTestEntryId: string | null = null;

    afterAll(async () => {
      // Cleanup attribute test data
      if (attrTestEntryId && testListSlug) {
        try {
          await listApi.deleteEntry(testListSlug, attrTestEntryId);
          console.log(`Cleaned up attribute test entry: ${attrTestEntryId}`);
        } catch (error) {
          console.warn(`Failed to cleanup attribute test entry: ${error}`);
        }
      }

      if (attrTestRecordId) {
        try {
          await recordApi.deleteRecord('people', attrTestRecordId);
          console.log(`Cleaned up attribute test record: ${attrTestRecordId}`);
        } catch (error) {
          console.warn(`Failed to cleanup attribute test record: ${error}`);
        }
      }
    });

    it('should create test data for attribute values test', async () => {
      const timestamp = Date.now();
      const testEmail = `test-attr-${timestamp}@integration-test.example.com`;

      const record = await recordApi.createRecord('people', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });

      attrTestRecordId = record.id.record_id;

      if (!testListSlug) {
        throw new Error('No test list available');
      }

      const entry = await listApi.createEntry(testListSlug, {
        data: {
          parent_record_id: attrTestRecordId,
          parent_object: 'people',
          entry_values: {},
        },
      });

      attrTestEntryId = entry.id.entry_id;
    });

    it('should list entry attribute values', async () => {
      if (!testListSlug || !attrTestEntryId) {
        throw new Error('Test prerequisites not met');
      }

      // Get the list to find available attributes
      const list = await listApi.getList(testListSlug);

      // Skip test if no attributes available
      if (!list.attributes || list.attributes.length === 0) {
        console.log('No attributes available for testing');
        return;
      }

      const firstAttribute = list.attributes[0];

      // This may return empty array if no values exist, which is fine
      const values = await listApi.listEntryAttributeValues(
        testListSlug,
        attrTestEntryId,
        firstAttribute.api_slug,
        { limit: 5 }
      );

      expect(values).toBeInstanceOf(Array);

      if (values.length > 0) {
        expect(values[0].attribute_id).toBeDefined();
        expect(values[0].created_at).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid entry ID', async () => {
      if (!testListSlug) {
        throw new Error('No test list available');
      }

      await expect(
        listApi.getEntry(testListSlug, 'invalid-entry-id')
      ).rejects.toThrow();
    });

    it('should throw error for invalid list slug', async () => {
      await expect(
        listApi.getEntry('invalid-list-slug', 'invalid-entry-id')
      ).rejects.toThrow();
    });

    it('should throw error when creating entry with invalid parent record', async () => {
      if (!testListSlug) {
        throw new Error('No test list available');
      }

      await expect(
        listApi.createEntry(testListSlug, {
          data: {
            parent_record_id: 'invalid-record-id',
            parent_object: 'people',
            entry_values: {},
          },
        })
      ).rejects.toThrow();
    });
  });
});
