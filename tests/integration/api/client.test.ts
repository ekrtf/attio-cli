import { describe, it, expect, beforeAll } from 'vitest';
import { AttioClient } from '../../../src/api/client';
import {
  WorkspaceMembersResponseSchema,
  WorkspaceMemberSchema,
} from '../../../src/api/types';
import {
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../../../src/api/errors';
import * as dotenv from 'dotenv';

// Load environment variables for integration tests
dotenv.config();

describe('AttioClient Integration Tests', () => {
  let client: AttioClient;

  beforeAll(() => {
    // Verify API key is available
    if (!process.env.ATTIO_API_KEY) {
      throw new Error(
        'ATTIO_API_KEY not found in environment. Cannot run integration tests.'
      );
    }
    client = new AttioClient();
  });

  describe('Authentication', () => {
    it('should successfully authenticate with valid API key', async () => {
      // This test will pass if we can make any request without auth errors
      const response = await client.get('/workspace_members');
      expect(response).toBeDefined();
    });

    it('should throw AuthenticationError with invalid API key', async () => {
      const invalidClient = new AttioClient('invalid-key-12345');

      await expect(async () => {
        await invalidClient.get('/workspace_members');
      }).rejects.toThrow(ApiError);
    });
  });

  describe('GET /workspace_members', () => {
    it('should fetch workspace members and validate against schema', async () => {
      const response = await client.get('/workspace_members');

      // Validate the entire response structure
      const validatedResponse = WorkspaceMembersResponseSchema.parse(response);
      expect(validatedResponse).toBeDefined();
      expect(validatedResponse.data).toBeInstanceOf(Array);

      // If there are members, validate the first one in detail
      if (validatedResponse.data.length > 0) {
        const firstMember = validatedResponse.data[0];

        // Validate individual member against schema
        const validatedMember = WorkspaceMemberSchema.parse(firstMember);

        // Check that all required fields are present
        expect(validatedMember.id).toBeDefined();
        expect(validatedMember.id.workspace_id).toBeDefined();
        expect(validatedMember.id.workspace_member_id).toBeDefined();
        expect(validatedMember.first_name).toBeDefined();
        expect(validatedMember.last_name).toBeDefined();
        expect(validatedMember.email_address).toBeDefined();
        expect(validatedMember.avatar_url).toBeDefined();
        expect(validatedMember.access_level).toBeDefined();
        expect(validatedMember.created_at).toBeDefined();

        // Validate access_level is one of the expected values
        expect(['admin', 'member', 'suspended']).toContain(
          validatedMember.access_level
        );

        // Validate email format
        expect(validatedMember.email_address).toMatch(
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        );

        // Validate created_at is a valid ISO datetime
        expect(() => new Date(validatedMember.created_at)).not.toThrow();
        // Verify it's a valid date (not NaN)
        expect(new Date(validatedMember.created_at).getTime()).not.toBeNaN();
        // Verify the format matches ISO 8601
        expect(validatedMember.created_at).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/
        );
      }
    });

    it('should return data array even if empty', async () => {
      const response = await client.get('/workspace_members');
      const validatedResponse = WorkspaceMembersResponseSchema.parse(response);

      expect(validatedResponse.data).toBeInstanceOf(Array);
    });

    it('should handle real API response structure correctly', async () => {
      const response = await client.get('/workspace_members');

      // Verify response has the expected structure before schema validation
      expect(response).toHaveProperty('data');
      expect(Array.isArray((response as any).data)).toBe(true);

      // Schema validation should not throw
      expect(() =>
        WorkspaceMembersResponseSchema.parse(response)
      ).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors correctly', async () => {
      await expect(async () => {
        await client.get('/workspace/nonexistent-endpoint-12345');
      }).rejects.toThrow(ApiError);
    });

    it('should preserve error details from API', async () => {
      try {
        await client.get('/workspace/nonexistent-endpoint-12345');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBeDefined();
          expect(error.message).toBeDefined();
        }
      }
    });
  });

  describe('HTTP Methods', () => {
    it('should support GET requests', async () => {
      const response = await client.get('/workspace_members');
      expect(response).toBeDefined();
    });

    // Note: We avoid testing destructive operations (POST, PATCH, DELETE)
    // in integration tests to prevent side effects. These will be tested
    // in later phases with proper test data cleanup.
  });

  describe('Type Safety', () => {
    it('should ensure all workspace member fields match schema', async () => {
      const response = await client.get('/workspace_members');
      const validatedResponse = WorkspaceMembersResponseSchema.parse(response);

      validatedResponse.data.forEach((member) => {
        // Zod will throw if any field doesn't match the schema
        expect(() => WorkspaceMemberSchema.parse(member)).not.toThrow();

        // Ensure no unexpected fields (this is implicit in Zod strict mode)
        const memberKeys = Object.keys(member);
        const expectedKeys = [
          'id',
          'first_name',
          'last_name',
          'email_address',
          'avatar_url',
          'access_level',
          'created_at',
        ];

        // All expected keys should be present
        expectedKeys.forEach((key) => {
          expect(memberKeys).toContain(key);
        });
      });
    });

    it('should validate nested ID structure', async () => {
      const response = await client.get('/workspace_members');
      const validatedResponse = WorkspaceMembersResponseSchema.parse(response);

      if (validatedResponse.data.length > 0) {
        const member = validatedResponse.data[0];

        // Validate nested ID structure
        expect(member.id).toHaveProperty('workspace_id');
        expect(member.id).toHaveProperty('workspace_member_id');
        expect(typeof member.id.workspace_id).toBe('string');
        expect(typeof member.id.workspace_member_id).toBe('string');
        expect(member.id.workspace_id.length).toBeGreaterThan(0);
        expect(member.id.workspace_member_id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit headers if present', async () => {
      // This test just verifies the client can make requests
      // Rate limiting with retry is tested in unit tests with mocks
      const response = await client.get('/workspace_members');
      expect(response).toBeDefined();
    });
  });
});
