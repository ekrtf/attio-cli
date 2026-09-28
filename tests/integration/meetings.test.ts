import { describe, it, expect, beforeAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { MeetingEndpoints } from '../../src/api/endpoints/meetings';
import { meetingBoundText } from '../../src/api/types';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Meetings Integration Tests (Read-Only)', () => {
  let client: AttioClient;
  let meetingApi: MeetingEndpoints;

  beforeAll(() => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
    meetingApi = new MeetingEndpoints(client);
  });

  describe('List Meetings', () => {
    it('should list meetings', async () => {
      const meetings = (await meetingApi.listMeetings({ limit: 5 })).meetings;

      expect(meetings).toBeInstanceOf(Array);

      if (meetings.length > 0) {
        const meeting = meetings[0];
        expect(meeting.id).toBeDefined();
        expect(meeting.id.meeting_id).toBeDefined();
        expect(meeting.title).toBeDefined();
        expect(meeting.created_at).toBeDefined();
        expect(meeting.start).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      const meetings = (await meetingApi.listMeetings({ limit: 2 })).meetings;

      expect(meetings).toBeInstanceOf(Array);
      expect(meetings.length).toBeLessThanOrEqual(2);
    });

    it('should sort meetings by start_at ascending', async () => {
      const meetings = (
        await meetingApi.listMeetings({
          sort: 'start_asc',
          limit: 5,
        })
      ).meetings;

      expect(meetings).toBeInstanceOf(Array);

      if (meetings.length >= 2 && meetings[0].start && meetings[1].start) {
        const firstStart = new Date(meetingBoundText(meetings[0].start));
        const secondStart = new Date(meetingBoundText(meetings[1].start));
        expect(firstStart.getTime()).toBeLessThanOrEqual(secondStart.getTime());
      }
    });

    it('should sort meetings by start_at descending', async () => {
      const meetings = (
        await meetingApi.listMeetings({
          sort: 'start_desc',
          limit: 5,
        })
      ).meetings;

      expect(meetings).toBeInstanceOf(Array);

      if (meetings.length >= 2 && meetings[0].start && meetings[1].start) {
        const firstStart = new Date(meetingBoundText(meetings[0].start));
        const secondStart = new Date(meetingBoundText(meetings[1].start));
        expect(firstStart.getTime()).toBeGreaterThanOrEqual(
          secondStart.getTime()
        );
      }
    });
  });

  describe('Get Meeting', () => {
    it('should get a specific meeting if any exist', async () => {
      const meetings = (await meetingApi.listMeetings({ limit: 1 })).meetings;

      if (meetings.length > 0) {
        const meetingId = meetings[0].id.meeting_id;
        const meeting = await meetingApi.getMeeting(meetingId);

        expect(meeting).toBeDefined();
        expect(meeting.id.meeting_id).toBe(meetingId);
        expect(meeting.title).toBeDefined();

        console.log(`✓ Retrieved meeting: ${meetingId}`);
      } else {
        console.log('⚠ No meetings found to test get operation');
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid meeting ID', async () => {
      await expect(
        meetingApi.getMeeting('invalid-meeting-id-12345')
      ).rejects.toThrow();
    });
  });

  describe('Filter Meetings', () => {
    it('should filter meetings by linked record if any exist', async () => {
      // First get any meeting
      const allMeetings = await meetingApi.listMeetings({ limit: 1 });

      if (allMeetings.length > 0 && allMeetings[0].linked_records) {
        const linkedRecords = allMeetings[0].linked_records;
        if (linkedRecords.length > 0) {
          const { target_object, target_record_id } = linkedRecords[0];

          // Try to filter by this linked record
          const filteredMeetings = await meetingApi.listMeetings({
            linked_object: target_object,
            linked_record_id: target_record_id,
          });

          expect(filteredMeetings).toBeInstanceOf(Array);
          console.log(
            `✓ Filtered meetings by linked record: ${target_record_id}`
          );
        } else {
          console.log('⚠ No linked records found to test filtering');
        }
      } else {
        console.log('⚠ No meetings found to test filtering');
      }
    });
  });
});
