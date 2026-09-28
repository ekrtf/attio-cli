import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { MeetingEndpoints } from '../api/endpoints/meetings';
import { meetingBoundText } from '../api/types';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';
import { present, readJson } from './present';

export function createMeetingCommand(): Command {
  const meeting = new Command('meeting').description(
    'View and manage meetings'
  );

  // List meetings
  meeting
    .command('list')
    .description('List meetings')
    .option('--limit <number>', 'Maximum meetings to return (1-200)', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor from a previous page')
    .option('--sort <sort>', 'Sort order (start_asc or start_desc)')
    .option('--linked-object <slug>', 'Filter by linked object (e.g., people)')
    .option('--linked-record-id <id>', 'Filter by linked record ID')
    .option(
      '--participants <emails>',
      'Comma-separated participant email addresses'
    )
    .option('--ends-from <iso>', 'Only meetings that end after this time')
    .option(
      '--starts-before <iso>',
      'Only meetings that start before this time'
    )
    .option('--timezone <iana>', 'Timezone used to interpret date filters')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        if (
          options.sort &&
          options.sort !== 'start_asc' &&
          options.sort !== 'start_desc'
        ) {
          throw new Error('Sort must be start_asc or start_desc');
        }

        const client = new AttioClient(options.apiKey);
        const meetingApi = new MeetingEndpoints(client);

        const page = await meetingApi.listMeetings({
          limit: options.limit,
          cursor: options.cursor,
          sort: options.sort,
          linked_object: options.linkedObject,
          linked_record_id: options.linkedRecordId,
          participants: options.participants,
          ends_from: options.endsFrom,
          starts_before: options.startsBefore,
          timezone: options.timezone,
        });

        if (page.nextCursor) {
          console.error(`Next cursor: ${page.nextCursor}`);
        }

        if (options.format === 'table') {
          const tableData = page.meetings.map((meeting) => ({
            meeting_id: meeting.id.meeting_id,
            title: meeting.title.substring(0, 50),
            start: meetingBoundText(meeting.start),
            end: meetingBoundText(meeting.end),
            created_at: new Date(meeting.created_at).toISOString(),
          }));
          console.log(formatGenericTable(tableData));
        } else if (options.format === 'csv') {
          console.log(formatCsv(page.meetings));
        } else {
          console.log(formatJson(page.meetings));
        }
      } catch (error) {
        reportError(error);
      }
    });

  // Get meeting
  meeting
    .command('get')
    .description('Get a specific meeting')
    .argument('<meeting-id>', 'Meeting ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (meetingId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const meetingApi = new MeetingEndpoints(client);

        const m = await meetingApi.getMeeting(meetingId);

        if (options.format === 'table') {
          console.log(
            formatGenericTable([
              {
                meeting_id: m.id.meeting_id,
                title: m.title,
                start: meetingBoundText(m.start),
                end: meetingBoundText(m.end),
                created_at: new Date(m.created_at).toISOString(),
              },
            ])
          );
        } else if (options.format === 'csv') {
          console.log(formatCsv(m));
        } else {
          console.log(formatJson(m));
        }
      } catch (error) {
        reportError(error);
      }
    });

  meeting
    .command('create')
    .description('Create a meeting')
    .requiredOption('--title <title>', 'Meeting title')
    .requiredOption('--description <text>', 'Meeting description')
    .option('--start <iso>', 'Start datetime')
    .option('--end <iso>', 'End datetime')
    .option('--timezone <iana>', 'IANA timezone for the start and end')
    .option('--all-day', 'Create an all-day meeting')
    .option('--start-date <date>', 'All-day start date, YYYY-MM-DD')
    .option('--end-date <date>', 'All-day end date, YYYY-MM-DD')
    .option('--participants <json>', 'Participant array as JSON')
    .option('--linked-records <json>', 'Linked records as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (options) => {
      try {
        const allDay = Boolean(options.allDay);
        let start: Record<string, unknown>;
        let end: Record<string, unknown>;
        if (allDay) {
          if (!options.startDate || !options.endDate) {
            throw new Error('--all-day requires --start-date and --end-date');
          }
          start = { date: options.startDate };
          end = { date: options.endDate };
        } else {
          if (!options.start || !options.end) {
            throw new Error('Provide --start and --end, or use --all-day');
          }
          start = {
            datetime: options.start,
            timezone: options.timezone ?? null,
          };
          end = { datetime: options.end, timezone: options.timezone ?? null };
        }
        const data: Record<string, unknown> = {
          title: options.title,
          description: options.description,
          is_all_day: allDay,
          start,
          end,
        };
        if (options.participants) {
          data.participants = readJson(options.participants, '--participants');
        }
        if (options.linkedRecords) {
          data.linked_records = readJson(
            options.linkedRecords,
            '--linked-records'
          );
        }
        const client = new AttioClient(options.apiKey);
        const meetingApi = new MeetingEndpoints(client);
        const created = await meetingApi.createMeeting({ data });
        present(created, options.format);
      } catch (error) {
        reportError(error);
      }
    });

  const linkCommand = (
    name: string,
    mode: 'patch' | 'put',
    description: string
  ) => {
    meeting
      .command(name)
      .description(description)
      .argument('<meeting-id>', 'Meeting ID')
      .requiredOption(
        '--linked-records <json>',
        'JSON array of {object, record_id}'
      )
      .option('--format <format>', 'Output format (json|table|csv)', 'json')
      .action(async (meetingId: string, options) => {
        try {
          const linked = readJson(options.linkedRecords, '--linked-records');
          if (!Array.isArray(linked)) {
            throw new Error('--linked-records must be a JSON array');
          }
          const client = new AttioClient(options.apiKey);
          const meetingApi = new MeetingEndpoints(client);
          const updated = await meetingApi.updateLinkedRecords(
            meetingId,
            linked as Array<{ object: string; record_id: string }>,
            mode
          );
          present(updated, options.format);
        } catch (error) {
          reportError(error);
        }
      });
  };

  linkCommand('link', 'patch', 'Add linked records to a meeting');
  linkCommand('set-links', 'put', 'Replace the linked records on a meeting');

  meeting
    .command('delete')
    .description('Delete a meeting')
    .argument('<meeting-id>', 'Meeting ID')
    .action(async (meetingId: string, options) => {
      try {
        const client = new AttioClient(options.apiKey);
        const meetingApi = new MeetingEndpoints(client);
        await meetingApi.deleteMeeting(meetingId);
        console.log(`Meeting ${meetingId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return meeting;
}
