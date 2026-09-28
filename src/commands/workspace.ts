import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { WorkspaceEndpoints } from '../api/endpoints/workspace';
import { formatJson } from '../formatters/json';
import { formatWorkspaceMembersTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';

export function createWorkspaceCommand(): Command {
  const workspace = new Command('workspace').description(
    'Manage workspace members and settings'
  );

  const members = new Command('members').description(
    'Manage workspace members'
  );

  members
    .command('list')
    .description('List all workspace members')
    .option('--limit <number>', 'Maximum number of members to return', parseInt)
    .option('--offset <number>', 'Number of members to skip', parseInt)
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const workspaceApi = new WorkspaceEndpoints(client);

        const workspaceMembers = await workspaceApi.listMembers({
          limit: options.limit,
          offset: options.offset,
        });

        if (options.format === 'table') {
          console.log(formatWorkspaceMembersTable(workspaceMembers));
        } else if (options.format === 'csv') {
          console.log(formatCsv(workspaceMembers));
        } else {
          console.log(formatJson(workspaceMembers));
        }
      } catch (error) {
        reportError(error);
      }
    });

  members
    .command('get')
    .description('Get a specific workspace member')
    .argument('<member-id>', 'Workspace member ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (memberId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const workspaceApi = new WorkspaceEndpoints(client);

        const member = await workspaceApi.getMember(memberId);

        if (options.format === 'table') {
          console.log(formatWorkspaceMembersTable([member]));
        } else if (options.format === 'csv') {
          console.log(formatCsv([member]));
        } else if (options.format === 'json') {
          console.log(formatJson(member));
        } else {
          throw new Error('Format must be json, table, or csv');
        }
      } catch (error) {
        reportError(error);
      }
    });

  workspace.addCommand(members);

  return workspace;
}
