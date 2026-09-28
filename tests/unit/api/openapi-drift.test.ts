import { describe, it, expect } from 'vitest';
import {
  buildManifest,
  compareCoverage,
  OpenApiSpec,
} from '../../../src/api/openapi-drift';

const spec: OpenApiSpec = {
  paths: {
    '/v2/notes': {
      get: {
        tags: ['Notes'],
        parameters: [{ name: 'limit', in: 'query', required: false }],
      },
    },
    '/v2/notes/{note_id}': {
      patch: {
        tags: ['Notes'],
        parameters: [{ name: 'note_id', in: 'path', required: true }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  data: {
                    properties: { title: { type: 'string' } },
                    required: ['title'],
                  },
                },
                required: ['data'],
              },
            },
          },
        },
      },
    },
    '/v2/webhooks': {
      get: { tags: ['Webhooks'] },
    },
  },
};

describe('openapi drift', () => {
  it('classifies implemented and deferred operations', () => {
    const manifest = buildManifest(
      spec,
      [{ method: 'GET', normalized: '/v2/notes' }],
      'https://api.attio.com/openapi/api'
    );

    expect(manifest.operations['GET /v2/notes']?.status).toBe('implemented');
    expect(manifest.operations['PATCH /v2/notes/{note_id}']?.status).toBe(
      'deferred'
    );
    expect(manifest.operations['GET /v2/webhooks']).toBeUndefined();
    expect(compareCoverage(spec, manifest)).toEqual([]);
  });

  it('fails when Attio adds an operation in a covered tag', () => {
    const manifest = buildManifest(
      spec,
      [{ method: 'GET', normalized: '/v2/notes' }],
      'https://api.attio.com/openapi/api'
    );
    delete manifest.operations['PATCH /v2/notes/{note_id}'];

    expect(compareCoverage(spec, manifest).join('\n')).toContain(
      'PATCH /v2/notes/{note_id}'
    );
  });

  it('fails when an implemented fingerprint changes', () => {
    const manifest = buildManifest(
      spec,
      [{ method: 'GET', normalized: '/v2/notes' }],
      'https://api.attio.com/openapi/api'
    );
    const entry = manifest.operations['GET /v2/notes'];
    if (!entry) {
      throw new Error('missing operation');
    }
    entry.fingerprint = 'stale';

    expect(compareCoverage(spec, manifest).join('\n')).toContain(
      'Fingerprint changed'
    );
  });
});
