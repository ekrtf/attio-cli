import Table from 'cli-table3';
import { WorkspaceMember } from '../api/types';
import { stripTerminalControls } from '../utils/terminal';

function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return stripTerminalControls(JSON.stringify(value));
  }
  return stripTerminalControls(String(value));
}

export function formatWorkspaceMembersTable(
  members: WorkspaceMember[]
): string {
  const table = new Table({
    head: [
      'Member ID',
      'First Name',
      'Last Name',
      'Email',
      'Access Level',
      'Created At',
    ],
    colWidths: [20, 15, 15, 30, 15, 28],
    wordWrap: true,
  });

  members.forEach((member) => {
    table.push([
      cell(member.id.workspace_member_id),
      cell(member.first_name),
      cell(member.last_name),
      cell(member.email_address),
      cell(member.access_level),
      cell(new Date(member.created_at).toISOString()),
    ]);
  });

  return table.toString();
}

export function formatGenericTable(
  data: Array<Record<string, unknown>>
): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  const keys = Object.keys(data[0]);
  const table = new Table({
    head: keys,
  });

  data.forEach((item) => {
    const row = keys.map((key) => cell(item[key]));
    table.push(row);
  });

  return table.toString();
}
