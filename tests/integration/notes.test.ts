import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { NoteEndpoints } from '../../src/api/endpoints/notes';
import { RecordEndpoints } from '../../src/api/endpoints/records';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Notes Integration Tests', () => {
  let client: AttioClient;
  let noteApi: NoteEndpoints;
  let recordApi: RecordEndpoints;
  let testNoteId: string | null = null;
  let testRecordId: string | null = null;

  beforeAll(() => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
    noteApi = new NoteEndpoints(client);
    recordApi = new RecordEndpoints(client);
  });

  afterAll(async () => {
    // Cleanup: delete test note and record if they were created
    if (testNoteId) {
      try {
        await noteApi.deleteNote(testNoteId);
        console.log(`Cleaned up test note: ${testNoteId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test note: ${error}`);
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

  describe('List Notes', () => {
    it('should list notes', async () => {
      const notes = await noteApi.listNotes({ limit: 5 });

      expect(notes).toBeInstanceOf(Array);

      if (notes.length > 0) {
        const note = notes[0];
        expect(note.id).toBeDefined();
        expect(note.id.note_id).toBeDefined();
        expect(note.title).toBeDefined();
        expect(note.created_at).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      const notes = await noteApi.listNotes({ limit: 2 });

      expect(notes).toBeInstanceOf(Array);
      expect(notes.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Create, Get, Update, Delete Note', () => {
    it('should create a test person record for notes', async () => {
      const timestamp = Date.now();
      const testEmail = `test-notes-${timestamp}@integration-test.example.com`;

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

      testRecordId = record.id.record_id;
      console.log(`✓ Created test record for notes: ${testRecordId}`);
    });

    it('should create a new note', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const data = {
        data: {
          parent_object: 'people',
          parent_record_id: testRecordId,
          title: 'Integration Test Note',
          format: 'markdown' as const,
          content:
            '## Test Note\n\nThis is a test note created by integration tests.',
          meeting_id: null,
        },
      };

      const note = await noteApi.createNote(data);

      expect(note).toBeDefined();
      expect(note.id.note_id).toBeDefined();
      expect(note.title).toBe('Integration Test Note');
      expect(note.parent_object).toBe('people');
      expect(note.parent_record_id).toBe(testRecordId);

      testNoteId = note.id.note_id;
      console.log(`✓ Created test note: ${testNoteId}`);
    });

    it('should get the created note', async () => {
      if (!testNoteId) {
        throw new Error('No test note created');
      }

      const note = await noteApi.getNote(testNoteId);

      expect(note).toBeDefined();
      expect(note.id.note_id).toBe(testNoteId);
      expect(note.title).toBe('Integration Test Note');

      console.log(`✓ Retrieved test note: ${testNoteId}`);
    });

    it('should update the note', async () => {
      if (!testNoteId) {
        throw new Error('No test note created');
      }

      const note = await noteApi.updateNote(testNoteId, {
        title: 'Updated Test Note',
        content: '## Updated Content\n\nThis note has been updated.',
        format: 'markdown',
      });

      expect(note).toBeDefined();
      expect(note.id.note_id).toBe(testNoteId);
      expect(note.title).toBe('Updated Test Note');

      console.log(`✓ Updated test note: ${testNoteId}`);
    });

    it('should list notes for the test record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const notes = await noteApi.listNotes({
        parent_object: 'people',
        parent_record_id: testRecordId,
      });

      expect(notes).toBeInstanceOf(Array);
      expect(notes.length).toBeGreaterThan(0);

      // Should find our test note
      const foundNote = notes.find((n) => n.id.note_id === testNoteId);
      expect(foundNote).toBeDefined();
      expect(foundNote?.title).toBe('Integration Test Note');

      console.log(`✓ Listed notes for record: ${testRecordId}`);
    });

    it('should delete the note', async () => {
      if (!testNoteId) {
        throw new Error('No test note created');
      }

      await noteApi.deleteNote(testNoteId);

      // Verify deletion by trying to get it (should throw)
      await expect(noteApi.getNote(testNoteId)).rejects.toThrow();

      console.log(`✓ Deleted test note: ${testNoteId}`);

      // Mark as null so afterAll doesn't try to delete again
      testNoteId = null;
    });

    it('should delete the test record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      await recordApi.deleteRecord('people', testRecordId);

      console.log(`✓ Deleted test record: ${testRecordId}`);

      testRecordId = null;
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid note ID', async () => {
      await expect(noteApi.getNote('invalid-note-id-12345')).rejects.toThrow();
    });
  });

  describe('Find Notes by Title', () => {
    let findTestNoteId1: string | null = null;
    let findTestNoteId2: string | null = null;
    let findTestRecordId: string | null = null;

    beforeAll(async () => {
      // Create test record
      const timestamp = Date.now();
      const testEmail = `test-find-notes-${timestamp}@integration-test.example.com`;

      const record = await recordApi.createRecord('people', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });
      findTestRecordId = record.id.record_id;
      console.log(`✓ Created test record for find notes: ${findTestRecordId}`);

      // Create two notes with different titles
      const note1 = await noteApi.createNote({
        data: {
          parent_object: 'people',
          parent_record_id: findTestRecordId,
          title: 'Executive Summary',
          format: 'plaintext',
          content: 'This is the executive summary.',
        },
      });
      findTestNoteId1 = note1.id.note_id;
      console.log(`✓ Created find test note 1: ${findTestNoteId1}`);

      const note2 = await noteApi.createNote({
        data: {
          parent_object: 'people',
          parent_record_id: findTestRecordId,
          title: 'Deal Summary: Q4 2024',
          format: 'plaintext',
          content: 'This is the deal summary for Q4.',
        },
      });
      findTestNoteId2 = note2.id.note_id;
      console.log(`✓ Created find test note 2: ${findTestNoteId2}`);
    });

    afterAll(async () => {
      // Cleanup: delete notes, then record
      if (findTestNoteId1) {
        await noteApi.deleteNote(findTestNoteId1).catch(() => {});
      }
      if (findTestNoteId2) {
        await noteApi.deleteNote(findTestNoteId2).catch(() => {});
      }
      if (findTestRecordId) {
        await recordApi
          .deleteRecord('people', findTestRecordId)
          .catch(() => {});
      }
    });

    it('should find note by exact title', async () => {
      if (!findTestRecordId) throw new Error('No test record created');

      const notes = await noteApi.findNotesByTitle('people', findTestRecordId, {
        title: 'Executive Summary',
      });

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Executive Summary');
    });

    it('should find note by pattern (starts with)', async () => {
      if (!findTestRecordId) throw new Error('No test record created');

      const notes = await noteApi.findNotesByTitle('people', findTestRecordId, {
        titlePattern: 'Deal Summary: *',
      });

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Deal Summary: Q4 2024');
    });

    it('should find note by pattern (contains)', async () => {
      if (!findTestRecordId) throw new Error('No test record created');

      const notes = await noteApi.findNotesByTitle('people', findTestRecordId, {
        titlePattern: '*Summary*',
      });

      expect(notes).toHaveLength(2);
    });

    it('should return empty array when no match', async () => {
      if (!findTestRecordId) throw new Error('No test record created');

      const notes = await noteApi.findNotesByTitle('people', findTestRecordId, {
        title: 'Non-existent Title',
      });

      expect(notes).toHaveLength(0);
    });

    it('should be case-insensitive for patterns', async () => {
      if (!findTestRecordId) throw new Error('No test record created');

      const notes = await noteApi.findNotesByTitle('people', findTestRecordId, {
        titlePattern: 'executive*',
      });

      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Executive Summary');
    });
  });

  describe('Update Note', () => {
    let updateTestNoteId: string | null = null;
    let updateTestRecordId: string | null = null;

    beforeAll(async () => {
      // Create test record
      const timestamp = Date.now();
      const testEmail = `test-update-note-${timestamp}@integration-test.example.com`;

      const record = await recordApi.createRecord('people', {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      });
      updateTestRecordId = record.id.record_id;
      console.log(
        `✓ Created test record for update note: ${updateTestRecordId}`
      );
    });

    afterAll(async () => {
      // Cleanup: delete note and record
      if (updateTestNoteId) {
        await noteApi.deleteNote(updateTestNoteId).catch(() => {});
      }
      if (updateTestRecordId) {
        await recordApi
          .deleteRecord('people', updateTestRecordId)
          .catch(() => {});
      }
    });

    it('should update title only', async () => {
      if (!updateTestRecordId) throw new Error('No test record created');

      // Create a note to update
      const note = await noteApi.createNote({
        data: {
          parent_object: 'people',
          parent_record_id: updateTestRecordId,
          title: 'Original Title',
          format: 'plaintext',
          content: 'Original content',
        },
      });
      const originalNoteId = note.id.note_id;

      const note = await noteApi.updateNote(originalNoteId, {
        title: 'Updated Title',
      });

      expect(note.title).toBe('Updated Title');
      expect(note.content_plaintext).toBe('Original content');
      expect(note.id.note_id).toBe(originalNoteId);

      updateTestNoteId = note.id.note_id;

      const fetched = await noteApi.getNote(originalNoteId);
      expect(fetched.title).toBe('Updated Title');
    });

    it('should update content only', async () => {
      if (!updateTestRecordId) throw new Error('No test record created');

      // Create a note to update
      const note = await noteApi.createNote({
        data: {
          parent_object: 'people',
          parent_record_id: updateTestRecordId,
          title: 'Content Test Title',
          format: 'plaintext',
          content: 'Original content here',
        },
      });
      const originalNoteId = note.id.note_id;

      const note = await noteApi.updateNote(originalNoteId, {
        content: 'Updated content here',
      });

      expect(note.title).toBe('Content Test Title');
      expect(note.content_plaintext).toBe('Updated content here');
      expect(note.id.note_id).toBe(originalNoteId);

      updateTestNoteId = note.id.note_id;
    });

    it('should update both title and content', async () => {
      if (!updateTestRecordId) throw new Error('No test record created');

      // Create a note to update
      const note = await noteApi.createNote({
        data: {
          parent_object: 'people',
          parent_record_id: updateTestRecordId,
          title: 'Both Test Title',
          format: 'plaintext',
          content: 'Both test content',
        },
      });
      const originalNoteId = note.id.note_id;

      const note = await noteApi.updateNote(originalNoteId, {
        title: 'Updated Both Title',
        content: 'Updated both content',
      });

      expect(note.title).toBe('Updated Both Title');
      expect(note.content_plaintext).toBe('Updated both content');
      expect(note.id.note_id).toBe(originalNoteId);

      updateTestNoteId = note.id.note_id;
    });

    it('should throw error when note not found', async () => {
      await expect(
        noteApi.updateNote('non-existent-note-id', { title: 'Test' })
      ).rejects.toThrow();
    });
  });
});
