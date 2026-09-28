import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { TaskEndpoints } from '../../src/api/endpoints/tasks';
import { RecordEndpoints } from '../../src/api/endpoints/records';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Tasks Integration Tests', () => {
  let client: AttioClient;
  let taskApi: TaskEndpoints;
  let recordApi: RecordEndpoints;
  let testTaskId: string | null = null;
  let testRecordId: string | null = null;

  beforeAll(() => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
    taskApi = new TaskEndpoints(client);
    recordApi = new RecordEndpoints(client);
  });

  afterAll(async () => {
    // Cleanup: delete test task and record if they were created
    if (testTaskId) {
      try {
        await taskApi.deleteTask(testTaskId);
        console.log(`Cleaned up test task: ${testTaskId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test task: ${error}`);
      }
    }

    if (testRecordId) {
      try {
        await recordApi.deleteRecord('people', testRecordId);
        console.log(`Cleaned up test record: ${testRecordId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test record: ${error}`);
      }
    }
  });

  describe('List Tasks', () => {
    it('should list tasks', async () => {
      const tasks = await taskApi.listTasks({ limit: 5 });

      expect(tasks).toBeInstanceOf(Array);

      if (tasks.length > 0) {
        const task = tasks[0];
        expect(task.id).toBeDefined();
        expect(task.id.task_id).toBeDefined();
        expect(task.content_plaintext).toBeDefined();
        expect(task.created_at).toBeDefined();
      }
    });

    it('should respect limit parameter', async () => {
      const tasks = await taskApi.listTasks({ limit: 2 });

      expect(tasks).toBeInstanceOf(Array);
      expect(tasks.length).toBeLessThanOrEqual(2);
    });

    it('should filter by completion status', async () => {
      const tasks = await taskApi.listTasks({
        is_completed: false,
        limit: 5,
      });

      expect(tasks).toBeInstanceOf(Array);

      tasks.forEach((task) => {
        expect(task.is_completed).toBe(false);
      });
    });
  });

  describe('Create, Get, Update, Delete Task', () => {
    it('should create a test person record for tasks', async () => {
      const timestamp = Date.now();
      const testEmail = `test-tasks-${timestamp}@integration-test.example.com`;

      const testData = {
        data: {
          values: {
            email_addresses: [{ email_address: testEmail }],
          },
        },
      };

      const record = await recordApi.createRecord('people', testData);

      expect(record).toBeDefined();
      expect(record.id.record_id).toBeDefined();

      testRecordId = record.id.record_id;
      console.log(`✓ Created test record for tasks: ${testRecordId}`);
    });

    it('should create a new task', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const data = {
        data: {
          content: 'Integration test task - please complete by end of week',
          format: 'plaintext' as const,
          deadline_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days from now
          is_completed: false,
          linked_records: [
            {
              target_object: 'people',
              target_record_id: testRecordId,
            },
          ],
          assignees: [],
        },
      };

      const task = await taskApi.createTask(data);

      expect(task).toBeDefined();
      expect(task.id.task_id).toBeDefined();
      expect(task.content_plaintext).toBe(
        'Integration test task - please complete by end of week'
      );
      expect(task.is_completed).toBe(false);
      expect(task.deadline_at).toBeDefined();

      testTaskId = task.id.task_id;
      console.log(`✓ Created test task: ${testTaskId}`);
    });

    it('should get the created task', async () => {
      if (!testTaskId) {
        throw new Error('No test task created');
      }

      const task = await taskApi.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.id.task_id).toBe(testTaskId);
      expect(task.content_plaintext).toBe(
        'Integration test task - please complete by end of week'
      );

      console.log(`✓ Retrieved test task: ${testTaskId}`);
    });

    it('should update the task', async () => {
      if (!testTaskId) {
        throw new Error('No test task created');
      }

      const updateData = {
        data: {
          is_completed: true,
          deadline_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(), // 14 days from now
        },
      };

      const task = await taskApi.updateTask(testTaskId, updateData);

      expect(task).toBeDefined();
      expect(task.id.task_id).toBe(testTaskId);
      expect(task.is_completed).toBe(true);
      expect(task.deadline_at).toBeDefined();

      console.log(`✓ Updated test task: ${testTaskId}`);
    });

    it('should list tasks for the test record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      const tasks = await taskApi.listTasks({
        linked_object: 'people',
        linked_record_id: testRecordId,
      });

      expect(tasks).toBeInstanceOf(Array);
      expect(tasks.length).toBeGreaterThan(0);

      // Should find our test task
      const foundTask = tasks.find((t) => t.id.task_id === testTaskId);
      expect(foundTask).toBeDefined();
      expect(foundTask?.is_completed).toBe(true);

      console.log(`✓ Listed tasks for record: ${testRecordId}`);
    });

    it('should delete the task', async () => {
      if (!testTaskId) {
        throw new Error('No test task created');
      }

      await taskApi.deleteTask(testTaskId);

      // Verify deletion by trying to get it (should throw)
      await expect(taskApi.getTask(testTaskId)).rejects.toThrow();

      console.log(`✓ Deleted test task: ${testTaskId}`);

      // Mark as null so afterAll doesn't try to delete again
      testTaskId = null;
    });

    it('should delete the test record', async () => {
      if (!testRecordId) {
        throw new Error('No test record created');
      }

      await recordApi.deleteRecord('people', testRecordId);

      console.log(`✓ Deleted test record: ${testRecordId}`);

      testRecordId = null;
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid task ID', async () => {
      await expect(taskApi.getTask('invalid-task-id-12345')).rejects.toThrow();
    });
  });
});
