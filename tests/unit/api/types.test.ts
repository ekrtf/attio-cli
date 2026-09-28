import { describe, it, expect } from 'vitest';
import {
  WorkspaceMemberSchema,
  ObjectSchema,
  AttributeSchema,
  RecordSchema,
  ListSchema,
  ListEntrySchema,
  NoteSchema,
  TaskSchema,
  MeetingSchema,
  asUUID,
  asSlug,
} from '../../../src/api/types';

describe('types', () => {
  describe('branded types', () => {
    it('should create UUID branded type', () => {
      const uuid = asUUID('123e4567-e89b-12d3-a456-426614174000');
      expect(typeof uuid).toBe('string');
    });

    it('should create Slug branded type', () => {
      const slug = asSlug('people');
      expect(typeof slug).toBe('string');
    });
  });

  describe('WorkspaceMemberSchema', () => {
    it('should validate valid workspace member', () => {
      const member = {
        id: {
          workspace_id: 'workspace-123',
          workspace_member_id: 'member-456',
        },
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        access_level: 'member',
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = WorkspaceMemberSchema.parse(member);
      expect(result).toEqual(member);
    });

    it('should reject invalid email', () => {
      const member = {
        id: {
          workspace_id: 'workspace-123',
          workspace_member_id: 'member-456',
        },
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'invalid-email',
        avatar_url: 'https://example.com/avatar.jpg',
        access_level: 'member',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(() => WorkspaceMemberSchema.parse(member)).toThrow();
    });

    it('should reject invalid access level', () => {
      const member = {
        id: {
          workspace_id: 'workspace-123',
          workspace_member_id: 'member-456',
        },
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        access_level: 'invalid',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(() => WorkspaceMemberSchema.parse(member)).toThrow();
    });
  });

  describe('ObjectSchema', () => {
    it('should validate valid object', () => {
      const obj = {
        id: {
          workspace_id: 'workspace-123',
          object_id: 'object-456',
        },
        api_slug: 'people',
        singular_noun: 'Person',
        plural_noun: 'People',
        created_at: '2024-01-01T00:00:00Z',
        is_built_in: true,
        is_workspace_level: false,
      };

      const result = ObjectSchema.parse(obj);
      expect(result).toEqual(obj);
    });
  });

  describe('AttributeSchema', () => {
    it('should validate valid attribute', () => {
      const attr = {
        id: {
          workspace_id: 'workspace-123',
          object_id: 'object-456',
          attribute_id: 'attr-789',
        },
        api_slug: 'email_address',
        title: 'Email Address',
        type: 'email-address',
        is_system_attribute: false,
        is_unique: true,
        is_required: true,
        is_multiselect: false,
        is_archived: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = AttributeSchema.parse(attr);
      expect(result).toEqual(attr);
    });

    it('should accept optional description', () => {
      const attr = {
        id: {
          workspace_id: 'workspace-123',
          object_id: 'object-456',
          attribute_id: 'attr-789',
        },
        api_slug: 'email_address',
        title: 'Email Address',
        description: 'Primary email address',
        type: 'text',
        is_system_attribute: false,
        is_unique: true,
        is_required: true,
        is_multiselect: false,
        is_archived: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = AttributeSchema.parse(attr);
      expect(result.description).toBe('Primary email address');
    });
  });

  describe('RecordSchema', () => {
    it('should validate valid record', () => {
      const record = {
        id: {
          workspace_id: 'workspace-123',
          object_id: 'object-456',
          record_id: 'record-789',
        },
        values: {
          name: { first_name: 'John', last_name: 'Doe' },
          email: 'john@example.com',
        },
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = RecordSchema.parse(record);
      expect(result).toEqual(record);
    });
  });

  describe('ListSchema', () => {
    it('should validate valid list', () => {
      const list = {
        id: {
          workspace_id: 'workspace-123',
          list_id: 'list-456',
        },
        api_slug: 'my-list',
        name: 'My List',
        parent_object: 'people',
        created_at: '2024-01-01T00:00:00Z',
        created_by_actor: {
          type: 'workspace-member',
          workspace_member_id: 'member-123',
        },
      };

      const result = ListSchema.parse(list);
      expect(result).toEqual(list);
    });
  });

  describe('ListEntrySchema', () => {
    it('should validate valid list entry', () => {
      const entry = {
        id: {
          workspace_id: 'workspace-123',
          list_id: 'list-456',
          entry_id: 'entry-789',
        },
        created_at: '2024-01-01T00:00:00Z',
        parent_record_id: 'record-123',
      };

      const result = ListEntrySchema.parse(entry);
      expect(result).toEqual(entry);
    });

    it('should accept optional entry_values', () => {
      const entry = {
        id: {
          workspace_id: 'workspace-123',
          list_id: 'list-456',
          entry_id: 'entry-789',
        },
        created_at: '2024-01-01T00:00:00Z',
        parent_record_id: 'record-123',
        entry_values: {
          status: 'active',
        },
      };

      const result = ListEntrySchema.parse(entry);
      expect(result.entry_values).toEqual({ status: 'active' });
    });
  });

  describe('NoteSchema', () => {
    it('should validate valid note', () => {
      const note = {
        id: {
          workspace_id: 'workspace-123',
          note_id: 'note-456',
        },
        title: 'Meeting Notes',
        content: '# Meeting Notes\nDiscussed project timeline',
        content_plaintext: 'Meeting Notes\nDiscussed project timeline',
        format: 'markdown',
        parent_object: 'people',
        parent_record_id: 'record-123',
        created_at: '2024-01-01T00:00:00Z',
        created_by_actor: {
          type: 'workspace-member',
          workspace_member_id: 'member-123',
        },
      };

      const result = NoteSchema.parse(note);
      expect(result).toEqual(note);
    });
  });

  describe('TaskSchema', () => {
    it('should validate valid task', () => {
      const task = {
        id: {
          workspace_id: 'workspace-123',
          task_id: 'task-456',
        },
        content: 'Follow up with **John**',
        content_plaintext: 'Follow up with John',
        is_completed: false,
        created_at: '2024-01-01T00:00:00Z',
        created_by_actor: {
          type: 'workspace-member',
          workspace_member_id: 'member-123',
        },
      };

      const result = TaskSchema.parse(task);
      expect(result).toEqual(task);
    });

    it('should accept optional fields', () => {
      const task = {
        id: {
          workspace_id: 'workspace-123',
          task_id: 'task-456',
        },
        content: 'Follow up',
        content_plaintext: 'Follow up',
        deadline_at: '2024-02-01T00:00:00Z',
        is_completed: true,
        completed_at: '2024-01-15T00:00:00Z',
        linked_records: [
          {
            target_object: 'people',
            target_record_id: 'record-123',
          },
        ],
        created_at: '2024-01-01T00:00:00Z',
        created_by_actor: {
          type: 'workspace-member',
          workspace_member_id: 'member-123',
        },
      };

      const result = TaskSchema.parse(task);
      expect(result.deadline_at).toBe('2024-02-01T00:00:00Z');
      expect(result.completed_at).toBe('2024-01-15T00:00:00Z');
    });
  });

  describe('MeetingSchema', () => {
    it('should validate valid meeting', () => {
      const meeting = {
        id: {
          workspace_id: 'workspace-123',
          meeting_id: 'meeting-456',
        },
        title: 'Project Kickoff',
        start: {
          datetime: '2024-01-15T10:00:00Z',
          timezone: 'UTC',
        },
        end: {
          datetime: '2024-01-15T11:00:00Z',
          timezone: 'UTC',
        },
        participants: [
          {
            email_address: 'person@example.com',
            is_organizer: true,
            status: 'accepted',
          },
        ],
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = MeetingSchema.parse(meeting);
      expect(result).toEqual(meeting);
    });
  });
});
