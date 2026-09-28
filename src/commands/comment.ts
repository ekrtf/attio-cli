import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { CommentEndpoints } from '../api/endpoints/comments';
import { reportError } from '../utils/cli-error';
import { present } from './present';

export function createCommentCommand(): Command {
  const comment = new Command('comment').description('Manage comments');

  comment
    .command('get')
    .description('Get a comment')
    .argument('<comment-id>', 'Comment ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (commentId: string, options) => {
      try {
        const api = new CommentEndpoints(new AttioClient(options.apiKey));
        present(await api.getComment(commentId), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  comment
    .command('create')
    .description('Create a comment on a thread, record, or list entry')
    .requiredOption('--content <text>', 'Comment text')
    .requiredOption('--author-id <id>', 'Workspace member ID of the author')
    .option('--thread-id <id>', 'Existing thread ID')
    .option('--record-object <slug>', 'Object slug when commenting on a record')
    .option('--record-id <id>', 'Record ID when commenting on a record')
    .option('--entry-list <slug>', 'List slug when commenting on an entry')
    .option('--entry-id <id>', 'Entry ID when commenting on an entry')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const data: Record<string, unknown> = {
          format: 'plaintext',
          content: options.content,
          author: { type: 'workspace-member', id: options.authorId },
        };
        const targets = [
          options.threadId,
          options.recordId,
          options.entryId,
        ].filter(Boolean);
        if (targets.length !== 1) {
          throw new Error(
            'Provide exactly one of --thread-id, --record-id, or --entry-id'
          );
        }
        if (options.threadId) {
          data.thread_id = options.threadId;
        } else if (options.recordId) {
          if (!options.recordObject) {
            throw new Error('--record-id requires --record-object');
          }
          data.record = {
            object: options.recordObject,
            record_id: options.recordId,
          };
        } else {
          if (!options.entryList) {
            throw new Error('--entry-id requires --entry-list');
          }
          data.entry = { list: options.entryList, entry_id: options.entryId };
        }
        const api = new CommentEndpoints(new AttioClient(options.apiKey));
        present(await api.createComment({ data }), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  comment
    .command('delete')
    .description('Delete a comment')
    .argument('<comment-id>', 'Comment ID')
    .action(async (commentId: string, options) => {
      try {
        const api = new CommentEndpoints(new AttioClient(options.apiKey));
        await api.deleteComment(commentId);
        console.log(`Comment ${commentId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return comment;
}
