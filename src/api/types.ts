import { z } from 'zod';

// Branded types for type safety
export type UUID = string & { readonly __brand: 'UUID' };
export type Slug = string & { readonly __brand: 'Slug' };

// Helper to create branded types
export function asUUID(value: string): UUID {
  return value as UUID;
}

export function asSlug(value: string): Slug {
  return value as Slug;
}

// Common schemas
export const TimestampSchema = z.string().datetime();

export const CreatedBySchema = z.object({
  type: z
    .enum(['workspace-member', 'system', 'api', 'api-token', 'app'])
    .nullable()
    .optional(),
  id: z.string().nullable().optional(),
  workspace_member_id: z.string().nullable().optional(),
  api_actor_id: z.string().nullable().optional(),
});

// Workspace Member
export const WorkspaceMemberIdSchema = z.object({
  workspace_id: z.string(),
  workspace_member_id: z.string(),
});

export const WorkspaceMemberSchema = z.object({
  id: WorkspaceMemberIdSchema,
  first_name: z.string(),
  last_name: z.string(),
  email_address: z.string().email(),
  avatar_url: z.string().nullable(),
  access_level: z.enum(['admin', 'member', 'suspended']),
  created_at: TimestampSchema,
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const WorkspaceMembersResponseSchema = z.object({
  data: z.array(WorkspaceMemberSchema),
});

// Object
export const ObjectIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
});

export const ObjectSchema = z.object({
  id: ObjectIdSchema,
  api_slug: z.string().nullable(),
  singular_noun: z.string().nullable(),
  plural_noun: z.string().nullable(),
  created_at: TimestampSchema,
  is_built_in: z.boolean().optional(),
  is_workspace_level: z.boolean().optional(),
});

export type ObjectType = z.infer<typeof ObjectSchema>;

export const ObjectsResponseSchema = z.object({
  data: z.array(ObjectSchema),
});

// Attribute Types
export const AttributeTypeSchema = z.enum([
  'text',
  'number',
  'checkbox',
  'date',
  'timestamp',
  'currency',
  'select',
  'multiselect',
  'status',
  'rating',
  'email-address',
  'phone-number',
  'domain',
  'location',
  'interaction',
  'actor-reference',
  'record-reference',
  'personal-name',
]);

export const AttributeIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  attribute_id: z.string(),
});

export const AttributeConfigSchema = z.object({
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  default_value: z.unknown().optional(),
  // Additional config fields vary by type
});

export const AttributeSchema = z.object({
  id: AttributeIdSchema,
  api_slug: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: AttributeTypeSchema,
  is_system_attribute: z.boolean(),
  is_unique: z.boolean(),
  is_required: z.boolean(),
  is_multiselect: z.boolean(),
  is_archived: z.boolean(),
  config: AttributeConfigSchema.optional(),
  created_at: TimestampSchema,
});

export type Attribute = z.infer<typeof AttributeSchema>;

export const AttributesResponseSchema = z.object({
  data: z.array(AttributeSchema),
});

// Attribute Values (for records)
export const AttributeValueSchema = z.object({
  attribute_id: z.string(),
  attribute_type: AttributeTypeSchema,
  value: z.unknown(), // Type varies by attribute_type
  created_by_actor: CreatedBySchema.optional(),
  active_from: TimestampSchema.optional(),
  active_until: TimestampSchema.optional(),
});

// Attribute Value History (for entry attribute values)
export const AttributeValueHistorySchema = z
  .object({
    active_from: z.string().nullable().optional(),
    active_until: z.string().nullable().optional(),
    attribute_type: z.string().optional(),
    value: z.unknown().optional(),
    created_by_actor: z
      .object({
        id: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
      })
      .optional(),
  })
  .passthrough();

export type AttributeValueHistory = z.infer<typeof AttributeValueHistorySchema>;

// Record
export const RecordIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  record_id: z.string(),
});

export const RecordSchema = z.object({
  id: RecordIdSchema,
  values: z.record(z.unknown()), // Map of attribute slug to value
  created_at: TimestampSchema,
});

export type AttioRecord = z.infer<typeof RecordSchema>;

export const RecordsResponseSchema = z.object({
  data: z.array(RecordSchema),
  next_cursor: z.string().optional(),
});

// List
export const ListIdSchema = z.object({
  workspace_id: z.string(),
  list_id: z.string(),
});

export const ListSchema = z.object({
  id: ListIdSchema,
  api_slug: z.string(),
  name: z.string(),
  parent_object: z.union([z.string(), z.array(z.string())]), // Can be string or array
  created_at: TimestampSchema,
  created_by_actor: CreatedBySchema,
  entry_count: z.number().optional(),
});

export type List = z.infer<typeof ListSchema>;

export const ListsResponseSchema = z.object({
  data: z.array(ListSchema),
});

// List Entry
export const ListEntryIdSchema = z.object({
  workspace_id: z.string(),
  list_id: z.string(),
  entry_id: z.string(),
});

export const ListEntrySchema = z.object({
  id: ListEntryIdSchema,
  created_at: TimestampSchema,
  parent_record_id: z.string(),
  parent_object: z.string().optional(),
  entry_values: z.record(z.unknown()).optional(),
});

export type ListEntry = z.infer<typeof ListEntrySchema>;

export const ListEntriesResponseSchema = z.object({
  data: z.array(ListEntrySchema),
  next_cursor: z.string().optional(),
});

// Note
export const NoteIdSchema = z.object({
  workspace_id: z.string(),
  note_id: z.string(),
});

export const NoteSchema = z.object({
  id: NoteIdSchema,
  title: z.string(),
  content: z.string().optional(),
  content_plaintext: z.string().optional(),
  content_markdown: z.string().optional(),
  format: z.enum(['plaintext', 'markdown', 'html']).optional(),
  meeting_id: z.string().nullable().optional(),
  tags: z.array(z.unknown()).optional(),
  parent_object: z.string(),
  parent_record_id: z.string(),
  created_at: TimestampSchema,
  created_by_actor: CreatedBySchema,
});

export type Note = z.infer<typeof NoteSchema>;

export const NotesResponseSchema = z.object({
  data: z.array(NoteSchema),
  next_cursor: z.string().optional(),
});

// Task
export const TaskIdSchema = z.object({
  workspace_id: z.string(),
  task_id: z.string(),
});

export const TaskSchema = z.object({
  id: TaskIdSchema,
  content: z.string().optional(),
  content_plaintext: z.string(),
  deadline_at: z.string().nullable().optional(),
  is_completed: z.boolean(),
  completed_at: z.string().nullable().optional(),
  linked_records: z
    .array(
      z.object({
        target_object: z.string().optional(),
        target_object_id: z.string().optional(),
        target_record_id: z.string().optional(),
      })
    )
    .optional(),
  assignees: z
    .array(
      z.object({
        referenced_actor_type: z.string(),
        referenced_actor_id: z.string(),
      })
    )
    .optional(),
  created_at: TimestampSchema,
  created_by_actor: CreatedBySchema,
});

export type Task = z.infer<typeof TaskSchema>;

export const TasksResponseSchema = z.object({
  data: z.array(TaskSchema),
  next_cursor: z.string().optional(),
});

// Meeting (read-only)
export const MeetingIdSchema = z.object({
  workspace_id: z.string(),
  meeting_id: z.string(),
});

export const MeetingBoundSchema = z.union([
  z.object({
    datetime: z.string(),
    timezone: z.string().nullable().optional(),
  }),
  z.object({
    date: z.string(),
  }),
]);

export type MeetingBound = z.infer<typeof MeetingBoundSchema>;

export function meetingBoundText(bound: MeetingBound | undefined): string {
  if (!bound) {
    return 'N/A';
  }
  if ('datetime' in bound) {
    return bound.datetime;
  }
  return bound.date;
}

export const MeetingSchema = z.object({
  id: MeetingIdSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  is_all_day: z.boolean().optional(),
  start: MeetingBoundSchema.optional(),
  end: MeetingBoundSchema.optional(),
  participants: z
    .array(
      z.object({
        status: z.string().optional(),
        is_organizer: z.boolean().optional(),
        email_address: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
      })
    )
    .optional(),
  linked_records: z.array(z.record(z.unknown())).optional(),
  created_at: TimestampSchema,
  created_by_actor: z
    .object({
      id: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
    })
    .optional(),
});

export type Meeting = z.infer<typeof MeetingSchema>;

export const MeetingsResponseSchema = z.object({
  data: z.array(MeetingSchema),
  pagination: z
    .object({
      next_cursor: z.string().nullable().optional(),
    })
    .optional(),
  next_cursor: z.string().nullable().optional(),
});

// Select Option
export const SelectOptionIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  attribute_id: z.string(),
  option_id: z.string(),
});

export const SelectOptionSchema = z.object({
  id: SelectOptionIdSchema,
  title: z.string(),
  is_archived: z.boolean(),
});

export type SelectOption = z.infer<typeof SelectOptionSchema>;

export const SelectOptionsResponseSchema = z.object({
  data: z.array(SelectOptionSchema),
});

// Status
export const StatusIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  attribute_id: z.string(),
  status_id: z.string(),
});

export const StatusSchema = z.object({
  id: StatusIdSchema,
  title: z.string(),
  is_archived: z.boolean(),
  celebration_enabled: z.boolean(),
  target_time_in_status: z.string().nullable().optional(), // ISO-8601 duration
});

export type Status = z.infer<typeof StatusSchema>;

export const StatusesResponseSchema = z.object({
  data: z.array(StatusSchema),
});

// Attribute with values (for convenience commands)
export type AttributeWithValues = Attribute & {
  select_options?: SelectOption[];
  statuses?: Status[];
};
