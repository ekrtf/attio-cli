import { Command } from 'commander';
import { AttioClient } from '../api/client';
import { RecordingEndpoints } from '../api/endpoints/recordings';
import { reportError } from '../utils/cli-error';
import { present, readJson } from './present';

export function createRecordingCommand(): Command {
  const recording = new Command('recording').description(
    'Manage meeting call recordings'
  );

  recording
    .command('list')
    .description('List call recordings for a meeting')
    .argument('<meeting-id>', 'Meeting ID')
    .option('--limit <number>', 'Maximum recordings to return', parseInt)
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (meetingId: string, options) => {
      try {
        const api = new RecordingEndpoints(new AttioClient(options.apiKey));
        const page = await api.listRecordings(meetingId, {
          limit: options.limit,
          cursor: options.cursor,
        });
        present(page.items, options.format, page.nextCursor);
      } catch (error) {
        reportError(error);
      }
    });

  recording
    .command('get')
    .description('Get a call recording')
    .argument('<meeting-id>', 'Meeting ID')
    .argument('<recording-id>', 'Call recording ID')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (meetingId: string, recordingId: string, options) => {
      try {
        const api = new RecordingEndpoints(new AttioClient(options.apiKey));
        present(await api.getRecording(meetingId, recordingId), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  recording
    .command('create')
    .description('Create a call recording')
    .argument('<meeting-id>', 'Meeting ID')
    .option('--video-url <url>', 'Video URL')
    .option('--transcript <json>', 'Transcript payload as JSON')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (meetingId: string, options) => {
      try {
        const data: { video_url?: string; transcript?: unknown } = {};
        if (options.videoUrl) data.video_url = options.videoUrl;
        if (options.transcript) {
          data.transcript = readJson(options.transcript, '--transcript');
        }
        if (!data.video_url && data.transcript === undefined) {
          throw new Error('Provide --video-url or --transcript');
        }
        const api = new RecordingEndpoints(new AttioClient(options.apiKey));
        present(await api.createRecording(meetingId, { data }), options.format);
      } catch (error) {
        reportError(error);
      }
    });

  recording
    .command('transcript')
    .description('Get a call recording transcript')
    .argument('<meeting-id>', 'Meeting ID')
    .argument('<recording-id>', 'Call recording ID')
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--format <format>', 'Output format (json|table|csv)', 'json')
    .action(async (meetingId: string, recordingId: string, options) => {
      try {
        const api = new RecordingEndpoints(new AttioClient(options.apiKey));
        present(
          await api.getTranscript(meetingId, recordingId, {
            cursor: options.cursor,
          }),
          options.format
        );
      } catch (error) {
        reportError(error);
      }
    });

  recording
    .command('delete')
    .description('Delete a call recording')
    .argument('<meeting-id>', 'Meeting ID')
    .argument('<recording-id>', 'Call recording ID')
    .action(async (meetingId: string, recordingId: string, options) => {
      try {
        const api = new RecordingEndpoints(new AttioClient(options.apiKey));
        await api.deleteRecording(meetingId, recordingId);
        console.log(`Recording ${recordingId} deleted successfully`);
      } catch (error) {
        reportError(error);
      }
    });

  return recording;
}
