import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { NoteEndpoints } from '../api/endpoints/notes';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';

function noteContentFormat(value: string): 'plaintext' | 'markdown' {
  if (value === 'plaintext' || value === 'markdown') {
    return value;
  }
  throw new Error('Content format must be plaintext or markdown');
}

export function createNoteCommand(): Command {
  const note = new Command('note').description('Manage notes');

  // List notes
  note
    .command('list')
    .description('List notes')
    .option('--limit <number>', 'Maximum notes to return', parseInt)
    .option('--offset <number>', 'Number of notes to skip', parseInt)
    .option('--parent-object <slug>', 'Filter by parent object (e.g., people)')
    .option('--parent-record-id <id>', 'Filter by parent record ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        const notes = await noteApi.listNotes({
          limit: options.limit,
          offset: options.offset,
          parent_object: options.parentObject,
          parent_record_id: options.parentRecordId,
        });

        if (options.format === 'table') {
          const tableData = notes.map((n) => ({
            note_id: n.id.note_id,
            title: n.title,
            parent_object: n.parent_object,
            format: n.format,
            created_at: new Date(n.created_at).toISOString(),
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(notes));
        } else {
          console.log(formatJson(notes));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Get note
  note
    .command('get')
    .description('Get a specific note')
    .argument('<note-id>', 'Note ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (noteId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        const n = await noteApi.getNote(noteId);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                note_id: n.id.note_id,
                title: n.title,
                parent_object: n.parent_object,
                format: n.format,
                created_at: new Date(n.created_at).toISOString(),
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(n));
        } else {
          console.log(formatJson(n));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Create note
  note
    .command('create')
    .description('Create a new note')
    .requiredOption('--parent-object <slug>', 'Parent object slug')
    .requiredOption('--parent-record-id <id>', 'Parent record ID')
    .requiredOption('--title <title>', 'Note title')
    .requiredOption('--content <content>', 'Note content')
    .option(
      '--format <format>',
      'Content format (plaintext|markdown)',
      'plaintext'
    )
    .option('--meeting-id <id>', 'Associated meeting ID')
    .option('--output <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        const data = {
          data: {
            parent_object: options.parentObject,
            parent_record_id: options.parentRecordId,
            title: options.title,
            format: noteContentFormat(options.format),
            content: options.content,
            meeting_id: options.meetingId || null,
          },
        };

        const n = await noteApi.createNote(data);

        if (options.output === 'table') {
          console.log(
            formatGenericTable([
              {
                note_id: n.id.note_id,
                title: n.title,
                parent_object: n.parent_object,
                format: n.format,
                created_at: new Date(n.created_at).toISOString(),
              },
            ])
          );
        } else if (options.output === 'csv') {
          console.log(formatCsv(n));
        } else {
          console.log(formatJson(n));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Delete note
  note
    .command('delete')
    .description('Delete a note')
    .argument('<note-id>', 'Note ID')
    .action(async (noteId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        await noteApi.deleteNote(noteId);
        console.log(`Note ${noteId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  // Update note
  note
    .command('update')
    .description('Update a note in place')
    .argument('<note-id>', 'Note ID to update')
    .option('--title <title>', 'New note title')
    .option('--content <content>', 'New note content')
    .option(
      '--content-format <format>',
      'Content format when --content is set (plaintext|markdown)'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (noteId: string, options) => {
      try {
        // Validate at least one update field is provided
        if (!options.title && !options.content) {
          console.error(
            'Error: At least one of --title or --content must be provided'
          );
          process.exit(1);
        }

        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        const updates: {
          title?: string;
          content?: string;
          format?: 'plaintext' | 'markdown';
        } = {};

        if (options.title) updates.title = options.title;
        if (options.content) {
          updates.content = options.content;
        }
        if (options.contentFormat) {
          updates.format = noteContentFormat(options.contentFormat);
        }

        const updated = await noteApi.updateNote(noteId, updates);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                note_id: updated.id.note_id,
                title: updated.title,
                parent_object: updated.parent_object,
                format: updated.format,
                created_at: new Date(updated.created_at).toISOString(),
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(updated));
        } else {
          console.log(formatJson(updated));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Find notes by title
  note
    .command('find')
    .description('Find notes by title for a parent record')
    .argument('<parent-object>', 'Parent object slug (e.g., people, deals)')
    .argument('<parent-record-id>', 'Parent record ID')
    .option('--title <title>', 'Exact title to match')
    .option(
      '--title-pattern <pattern>',
      'Glob pattern to match (* = any chars, ? = single char)'
    )
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (parentObject: string, parentRecordId: string, options) => {
      try {
        // Validate exactly one of title or title-pattern is provided
        if (!options.title && !options.titlePattern) {
          console.error(
            'Error: Either --title or --title-pattern must be provided'
          );
          process.exit(1);
        }
        if (options.title && options.titlePattern) {
          console.error('Error: Cannot use both --title and --title-pattern');
          process.exit(1);
        }

        const client = new AttioClient(options.apiKey);
        const noteApi = new NoteEndpoints(client);

        const notes = await noteApi.findNotesByTitle(
          parentObject,
          parentRecordId,
          {
            title: options.title,
            titlePattern: options.titlePattern,
          }
        );

        if (options.format === 'table') {
          const tableData = notes.map((n) => ({
            note_id: n.id.note_id,
            title: n.title,
            parent_object: n.parent_object,
            format: n.format,
            created_at: new Date(n.created_at).toISOString(),
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(notes));
        } else {
          console.log(formatJson(notes));
        }
      } catch (error) {
        reportError(error);
      }
    });

  return note;
}
