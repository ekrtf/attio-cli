import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
}

export interface OpenApiParameter {
  $ref?: string;
  name?: string;
  in?: string;
  required?: boolean;
}

export interface OpenApiOperation {
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: JsonSchema;
      };
    };
  };
}

export interface OpenApiSpec {
  paths?: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, JsonSchema>;
    parameters?: Record<string, OpenApiParameter>;
  };
}

export interface CoverageEntry {
  status: 'implemented' | 'deferred';
  reason?: string;
  fingerprint?: string;
}

export interface CoverageManifest {
  specUrl: string;
  coveredTags: string[];
  ignoredTags: Record<string, string>;
  operations: Record<string, CoverageEntry>;
}

export interface SpecOperation {
  key: string;
  method: string;
  path: string;
  tags: string[];
  fingerprint: string;
  normalized: string;
}

export function operationKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function normalizeTemplate(path: string): string {
  const withoutQuery = path.split('?')[0] || '';
  const withVersion = withoutQuery.startsWith('/v2/')
    ? withoutQuery
    : `/v2${withoutQuery.startsWith('/') ? '' : '/'}${withoutQuery}`;
  return withVersion.replace(/\$\{[^}]+\}/g, '{}').replace(/\{[^}]+\}/g, '{}');
}

function isOperation(
  method: string,
  value: unknown
): value is OpenApiOperation {
  return (
    HTTP_METHODS.includes(method as (typeof HTTP_METHODS)[number]) &&
    typeof value === 'object' &&
    value !== null
  );
}

function resolveSchema(
  spec: OpenApiSpec,
  schema: JsonSchema | undefined
): JsonSchema | undefined {
  if (!schema?.$ref) {
    return schema;
  }
  const name = schema.$ref.replace('#/components/schemas/', '');
  return spec.components?.schemas?.[name];
}

function resolveParameter(
  spec: OpenApiSpec,
  parameter: OpenApiParameter
): OpenApiParameter {
  if (!parameter.$ref) {
    return parameter;
  }
  const name = parameter.$ref.replace('#/components/parameters/', '');
  return spec.components?.parameters?.[name] || parameter;
}

export function fingerprintOperation(
  spec: OpenApiSpec,
  operation: OpenApiOperation
): string {
  const params = (operation.parameters || [])
    .map((parameter) => resolveParameter(spec, parameter))
    .filter((parameter) => parameter.in === 'path' || parameter.in === 'query')
    .map(
      (parameter) =>
        `${parameter.in}:${parameter.name}:${parameter.required ? 'required' : 'optional'}`
    )
    .sort();

  const bodySchema = resolveSchema(
    spec,
    operation.requestBody?.content?.['application/json']?.schema
  );
  const dataSchema = resolveSchema(spec, bodySchema?.properties?.data);
  const shape = dataSchema?.properties ? dataSchema : bodySchema;
  const required = new Set(shape?.required || []);
  const body = Object.keys(shape?.properties || {})
    .sort()
    .map(
      (name) =>
        `body.${dataSchema?.properties ? 'data.' : ''}${name}:${required.has(name) ? 'required' : 'optional'}`
    );

  return [...params, ...body].join('\n');
}

export function listSpecOperations(spec: OpenApiSpec): SpecOperation[] {
  const operations: SpecOperation[] = [];
  for (const [path, item] of Object.entries(spec.paths || {})) {
    for (const [method, value] of Object.entries(item)) {
      if (!isOperation(method, value)) {
        continue;
      }
      operations.push({
        key: operationKey(method, path),
        method: method.toUpperCase(),
        path,
        tags: value.tags || [],
        fingerprint: fingerprintOperation(spec, value),
        normalized: normalizeTemplate(path),
      });
    }
  }
  return operations.sort((left, right) => left.key.localeCompare(right.key));
}

export function scanEndpointSource(
  directory: string
): Array<{ method: string; normalized: string; file: string }> {
  const calls: Array<{ method: string; normalized: string; file: string }> = [];
  const pattern =
    /this\.client\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g;

  for (const fileName of readdirSync(directory)) {
    if (!fileName.endsWith('.ts')) {
      continue;
    }
    const file = join(directory, fileName);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) {
      calls.push({
        method: match[1].toUpperCase(),
        normalized: normalizeTemplate(match[2]),
        file: fileName,
      });
    }
  }

  return calls;
}

export function waiverReason(key: string): string {
  if (key.includes('/meetings') && !key.startsWith('GET ')) {
    return 'Meetings are read-only in this CLI.';
  }
  if (key.includes('/views')) {
    return 'Saved views are not exposed by this CLI.';
  }
  if (key.includes('/records/merge') || key.includes('/records/search')) {
    return 'Record merge and workspace search are not exposed by this CLI.';
  }
  if (key.includes('/attributes/') && key.includes('/values')) {
    return 'Attribute value history writes are not exposed by this CLI.';
  }
  if (
    key === 'POST /v2/objects' ||
    key.startsWith('PATCH /v2/objects/') ||
    key.startsWith('DELETE /v2/objects/')
  ) {
    return 'Creating, updating, and deleting object definitions is not exposed by this CLI.';
  }
  if (key.includes('/records/') && key.endsWith('/entries')) {
    return 'Listing the lists a record belongs to is not exposed by this CLI.';
  }
  return 'Not implemented yet. Implement it or keep this explicit waiver.';
}

export function buildManifest(
  spec: OpenApiSpec,
  scanned: Array<{ method: string; normalized: string }>,
  specUrl: string
): CoverageManifest {
  const manifest: CoverageManifest = {
    specUrl,
    coveredTags: [
      'Attributes',
      'Entries',
      'Lists',
      'Meetings',
      'Notes',
      'Objects',
      'Records',
      'Tasks',
      'Workspace members',
    ],
    ignoredTags: {
      Activities: 'Activity logging is outside this CLI.',
      'Activity records': 'Activity records are outside this CLI.',
      Comments: 'Comments are outside this CLI.',
      Emails: 'Email sync is outside this CLI.',
      Files: 'File upload is outside this CLI.',
      'Call recordings': 'Call recordings are outside this CLI.',
      Transcripts: 'Transcripts are outside this CLI.',
      Meta: 'Meta endpoints are outside this CLI.',
      Sequences: 'Sequences are outside this CLI.',
      SQL: 'The SQL endpoint is outside this CLI.',
      Threads: 'Threads are outside this CLI.',
      Webhooks: 'Webhook management is outside this CLI.',
      'Object views': 'Saved views are outside this CLI.',
      'List views': 'Saved views are outside this CLI.',
    },
    operations: {},
  };

  for (const operation of listSpecOperations(spec)) {
    const covered = operation.tags.some((tag) =>
      manifest.coveredTags.includes(tag)
    );
    if (!covered) {
      continue;
    }
    const implemented = scanned.some(
      (call) =>
        call.method === operation.method &&
        call.normalized === operation.normalized
    );
    manifest.operations[operation.key] = implemented
      ? { status: 'implemented', fingerprint: operation.fingerprint }
      : { status: 'deferred', reason: waiverReason(operation.key) };
  }

  return manifest;
}

export function compareCoverage(
  spec: OpenApiSpec,
  manifest: CoverageManifest
): string[] {
  const problems: string[] = [];
  const live = listSpecOperations(spec);
  const liveByKey = new Map(
    live.map((operation) => [operation.key, operation])
  );
  const seenTags = new Set<string>();

  for (const operation of live) {
    for (const tag of operation.tags) {
      seenTags.add(tag);
    }
    const covered = operation.tags.some((tag) =>
      manifest.coveredTags.includes(tag)
    );
    const ignored =
      operation.tags.length > 0 &&
      operation.tags.every((tag) => tag in manifest.ignoredTags);
    if (!covered && !ignored) {
      continue;
    }
    if (!covered) {
      continue;
    }
    const entry = manifest.operations[operation.key];
    if (!entry) {
      problems.push(`New Attio operation is not classified: ${operation.key}`);
      continue;
    }
    if (entry.status === 'deferred' && !entry.reason?.trim()) {
      problems.push(`${operation.key} is deferred without a reason`);
    }
    if (
      entry.status === 'implemented' &&
      entry.fingerprint !== operation.fingerprint
    ) {
      problems.push(
        `Fingerprint changed for ${operation.key}\nExpected:\n${entry.fingerprint || '(none)'}\nActual:\n${operation.fingerprint}`
      );
    }
  }

  for (const tag of seenTags) {
    if (!manifest.coveredTags.includes(tag) && !(tag in manifest.ignoredTags)) {
      problems.push(`New Attio API tag is not classified: ${tag}`);
    }
  }

  for (const [key, entry] of Object.entries(manifest.operations)) {
    if (!liveByKey.has(key)) {
      problems.push(
        `Manifest operation no longer exists in the Attio spec: ${key}`
      );
    }
    if (entry.status === 'implemented' && entry.fingerprint === undefined) {
      problems.push(`${key} is implemented without a fingerprint`);
    }
  }

  return problems;
}

export function compareSourceToManifest(
  spec: OpenApiSpec,
  manifest: CoverageManifest,
  scanned: Array<{ method: string; normalized: string; file: string }>
): string[] {
  const problems: string[] = [];
  const live = listSpecOperations(spec);

  for (const call of scanned) {
    const matches = live.filter(
      (operation) =>
        operation.method === call.method &&
        operation.normalized === call.normalized
    );
    if (matches.length === 0) {
      problems.push(
        `${call.file} calls ${call.method} ${call.normalized}, which is not in the Attio spec`
      );
      continue;
    }
    for (const match of matches) {
      const entry = manifest.operations[match.key];
      if (!entry || entry.status !== 'implemented') {
        problems.push(
          `${call.file} calls ${match.key}, but the coverage manifest does not mark it implemented`
        );
      }
    }
  }

  return problems;
}
