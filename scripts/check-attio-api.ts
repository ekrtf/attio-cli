import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  CoverageManifest,
  OpenApiSpec,
  buildManifest,
  compareCoverage,
  compareSourceToManifest,
  listSpecOperations,
  scanEndpointSource,
} from '../src/api/openapi-drift';

const root = resolve(__dirname, '..');
const manifestPath = resolve(root, 'api/attio-coverage.json');
const specUrl = 'https://api.attio.com/openapi/api';

async function loadSpec(): Promise<OpenApiSpec> {
  const file = process.env.ATTIO_OPENAPI_FILE;
  if (file) {
    return JSON.parse(readFileSync(file, 'utf8')) as OpenApiSpec;
  }

  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Attio OpenAPI (${response.status})`);
  }
  return (await response.json()) as OpenApiSpec;
}

function readManifest(): CoverageManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as CoverageManifest;
}

async function main(): Promise<void> {
  const spec = await loadSpec();
  const scanned = scanEndpointSource(resolve(root, 'src/api/endpoints'));

  if (process.argv.includes('--init')) {
    const manifest = buildManifest(spec, scanned, specUrl);
    mkdirSync(resolve(root, 'api'), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Wrote ${manifestPath}`);
    return;
  }

  if (process.argv.includes('--update')) {
    const manifest = readManifest();
    const live = new Map(
      listSpecOperations(spec).map((operation) => [operation.key, operation])
    );
    for (const [key, entry] of Object.entries(manifest.operations)) {
      const operation = live.get(key);
      if (entry.status === 'implemented' && operation) {
        entry.fingerprint = operation.fingerprint;
      }
    }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log('Updated implemented operation fingerprints');
  }

  const manifest = readManifest();
  const problems = [
    ...compareCoverage(spec, manifest),
    ...compareSourceToManifest(spec, manifest, scanned),
  ];

  if (problems.length > 0) {
    console.error(problems.join('\n\n'));
    process.exit(1);
  }

  console.log(
    `Attio API coverage is current (${Object.keys(manifest.operations).length} classified operations).`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
