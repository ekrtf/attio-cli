import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { MeetingEndpoints } from '../api/endpoints/meetings';
import { meetingBoundText } from '../api/types';
import { formatJson } from '../formatters/json';
import { formatGenericTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { reportError } from '../utils/cli-error';

export function createMeetingCommand(): Command {
  const meeting = new Command('meeting').description(
    'View meetings (read-only)'
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

  return meeting;
}
