import { AttioClient } from '../client';
import { NotesResponseSchema, NoteSchema, Note } from '../types';
import { validate } from '../../utils/validation';

/**
 * Convert a simple glob pattern to a RegExp
 * Supports: * (any chars) and ? (single char)
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // * -> .*
    .replace(/\?/g, '.'); // ? -> .
  return new RegExp(`^${escaped}$`, 'i'); // Case-insensitive, full match
}

export interface ListNotesOptions {
  limit?: number;
  offset?: number;
  parent_object?: string;
  parent_record_id?: string;
}

export interface CreateNoteData {
  data: {
    parent_object: string;
    parent_record_id: string;
    title: string;
    format: 'plaintext' | 'markdown';
    content: string;
    meeting_id?: string | null;
    created_at?: string;
  };
}

export class NoteEndpoints {
  constructor(private client: AttioClient) {}

  async listNotes(options?: ListNotesOptions): Promise<Note[]> {
    const params: Record<string, unknown> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    if (options?.parent_object) params.parent_object = options.parent_object;
    if (options?.parent_record_id)
      params.parent_record_id = options.parent_record_id;

    const response = await this.client.get('/notes', params);
    const validated = validate(NotesResponseSchema, response);
    return validated.data;
  }

  async getNote(noteId: string): Promise<Note> {
    const response = await this.client.get(`/notes/${noteId}`);
    const dataResponse = response as { data: unknown };
    return validate(NoteSchema, dataResponse.data);
  }

  async createNote(data: CreateNoteData): Promise<Note> {
    const response = await this.client.post('/notes', data);
    const dataResponse = response as { data: unknown };
    return validate(NoteSchema, dataResponse.data);
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.client.delete(`/notes/${noteId}`);
  }

  /**
   * Patch the note in place. Attio's update call keeps the note id,
   * meeting link, and fields the caller did not send.
   */
  async updateNote(
    noteId: string,
    updates: {
      title?: string;
      content?: string;
      format?: 'plaintext' | 'markdown';
    }
  ): Promise<Note> {
    const data: {
      title?: string;
      content?: string;
      format?: 'plaintext' | 'markdown';
    } = {};

    if (updates.title !== undefined) {
      data.title = updates.title;
    }
    if (updates.content !== undefined) {
      data.content = updates.content;
      data.format = updates.format || (await this.inferNoteFormat(noteId));
    } else if (updates.format !== undefined) {
      data.format = updates.format;
    }

    const response = await this.client.patch(`/notes/${noteId}`, { data });
    const dataResponse = response as { data: unknown };
    return validate(NoteSchema, dataResponse.data);
  }

  private async inferNoteFormat(
    noteId: string
  ): Promise<'plaintext' | 'markdown'> {
    const original = await this.getNote(noteId);
    if (
      original.content_markdown &&
      original.content_markdown !== original.content_plaintext
    ) {
      return 'markdown';
    }
    return 'plaintext';
  }

  /**
   * Find notes by title (exact match or glob pattern)
   */
  async findNotesByTitle(
    parentObject: string,
    parentRecordId: string,
    options: { title?: string; titlePattern?: string }
  ): Promise<Note[]> {
    const notes = await this.listAllNotes({
      parent_object: parentObject,
      parent_record_id: parentRecordId,
    });

    // Filter by exact title or pattern
    if (options.title) {
      const title = options.title.toLowerCase();
      return notes.filter((note) => note.title.toLowerCase() === title);
    }

    if (options.titlePattern) {
      const regex = globToRegex(options.titlePattern);
      return notes.filter((note) => regex.test(note.title));
    }

    return notes;
  }

  private async listAllNotes(options: ListNotesOptions): Promise<Note[]> {
    const pageSize = 50;
    const notes: Note[] = [];
    let offset = 0;

    for (let page = 0; page < 200; page += 1) {
      const batch = await this.listNotes({
        ...options,
        limit: pageSize,
        offset,
      });
      notes.push(...batch);
      if (batch.length < pageSize) {
        return notes;
      }
      offset += pageSize;
    }

    return notes;
  }
}
