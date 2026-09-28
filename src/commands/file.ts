import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { FileEndpoints } from '../api/endpoints/files';
import { reportError } from '../utils/cli-error';
import { present, readJson } from './present';

export function createFileCommand(): Command {
  const file = new Command('file').description('Manage files on records');

  file
    .command('list')
    .description('List files on a record')
    .requiredOption('--object <slug>', 'Object slug or ID')
    .requiredOption('--record-id <id>', 'Record ID')
    .option('--storage-provider <name>', 'Filter by storage provider')
    .option('--parent-folder-id <id>', 'Folder to list')
    .option('--limit <number>', 'Maximum files to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        const page = await api.listFiles({
          object: options.object,
          recordId: options.recordId,
          storageProvider: options.storageProvider,
          parentFolderId: options.parentFolderId,
          limit: options.limit,
          cursor: options.cursor,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('get')
    .description('Get a file')
    .argument('<file-id>', 'File ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (fileId: string, options) => {
      try {
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        present(await api.getFile(fileId), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('mkdir')
    .description('Create a folder on a record')
    .requiredOption('--object <slug>', 'Object slug or ID')
    .requiredOption('--record-id <id>', 'Record ID')
    .requiredOption('--name <name>', 'Folder name')
    .option('--parent-folder-id <id>', 'Parent folder ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const body: Record<string, unknown> = {
          object: options.object,
          record_id: options.recordId,
          file_type: 'folder',
          name: options.name,
        };
        if (options.parentFolderId) {
          body.parent_folder_id = options.parentFolderId;
        }
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        present(await api.createFile(body), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('create')
    .description('Create a connected file entry from JSON')
    .requiredOption('--data <json>', 'File create body as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const body = readJson(options.data, '--data');
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
          throw new Error('--data must be a JSON object');
        }
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        present(
          await api.createFile(body as Record<string, unknown>),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('upload')
    .description('Upload a file onto a record')
    .requiredOption('--file <path>', 'Path to the file')
    .requiredOption('--object <slug>', 'Object slug or ID')
    .requiredOption('--record-id <id>', 'Record ID')
    .option('--parent-folder-id <id>', 'Parent folder ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        present(
          await api.uploadFile({
            filePath: options.file,
            object: options.object,
            recordId: options.recordId,
            parentFolderId: options.parentFolderId,
          }),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('download-url')
    .description('Print the redirect URL for a file download')
    .argument('<file-id>', 'File ID')
    .action(async (fileId: string, options) => {
      try {
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        const url = await api.downloadUrl(fileId);
        console.log(url);
      } catch (error) {
        reportError(error);
      }
    });

  file
    .command('delete')
    .description('Delete a file')
    .argument('<file-id>', 'File ID')
    .action(async (fileId: string, options) => {
      try {
        const api = new FileEndpoints(new AttioClient(options.apiKey));
        await api.deleteFile(fileId);
        console.log(`File ${fileId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return file;
}
