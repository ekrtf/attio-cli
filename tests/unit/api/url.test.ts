import { describe, it, expect } from 'vitest';
import { safeApiPath } from '../../../src/api/url';

describe('safeApiPath', () => {
  it('encodes path segments', () => {
    expect(safeApiPath('/notes/a b')).toBe('/notes/a%20b');
  });

  it('rejects traversal, query strings, and absolute URLs', () => {
    expect(() => safeApiPath('/objects/../notes')).toThrow(/relative/);
    expect(() => safeApiPath('/objects?x=1')).toThrow(/query/);
    expect(() => safeApiPath('//evil.example/steal')).toThrow(/slash/);
    expect(() => safeApiPath('https://evil.example')).toThrow(/slash/);
  });
});
