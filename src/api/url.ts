const CONTROL_CHARACTERS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`
);

/**
 * Keep request URLs on the Attio API origin.
 * Rejects absolute URLs, query strings, and dot segments so a record id
 * cannot retarget the bearer token or rewrite the path.
 */
export function safeApiPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API path must start with a single slash');
  }
  if (path.includes('?') || path.includes('#') || path.includes('\\')) {
    throw new Error(
      'API path must not include a query string. Pass query parameters separately.'
    );
  }
  if (CONTROL_CHARACTERS.test(path)) {
    throw new Error('API path contains control characters');
  }

  const segments = path.split('/');
  const encoded = segments.map((segment, index) => {
    if (index === 0) {
      return '';
    }
    if (segment === '' || segment === '.' || segment === '..') {
      throw new Error('API path segments must not be empty or relative');
    }
    return encodeURIComponent(segment);
  });

  return encoded.join('/');
}
