import { describe, it, expect } from 'vitest';
import { formatCsv } from '../../../src/formatters/csv';

describe('formatCsv', () => {
  it('should format simple objects as CSV', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];
    const result = formatCsv(data);

    expect(result).toContain('name');
    expect(result).toContain('age');
    expect(result).toContain('John');
    expect(result).toContain('Jane');
  });

  it('should flatten nested objects', () => {
    const data = [
      {
        name: 'John',
        address: {
          city: 'New York',
          country: 'USA',
        },
      },
    ];
    const result = formatCsv(data);

    expect(result).toContain('name');
    expect(result).toContain('address.city');
    expect(result).toContain('address.country');
    expect(result).toContain('New York');
  });

  it('should handle arrays by joining with semicolons', () => {
    const data = [{ tags: ['tag1', 'tag2', 'tag3'] }];
    const result = formatCsv(data);

    expect(result).toContain('tag1; tag2; tag3');
  });

  it('should handle null values', () => {
    const data = [{ name: 'John', middle: null }];
    const result = formatCsv(data);

    expect(result).toContain('name');
    expect(result).toContain('middle');
  });

  it('should handle single object by converting to array', () => {
    const data = { name: 'John', age: 30 };
    const result = formatCsv(data);

    expect(result).toContain('name');
    expect(result).toContain('John');
  });

  it('should strip carriage returns that rewrite the terminal line', () => {
    const result = formatCsv([{ title: 'Secret\rHARMLESS' }]);
    expect(result).not.toContain('\r');
    expect(result).toContain('SecretHARMLESS');
  });

  it('should neutralize spreadsheet formulas', () => {
    const result = formatCsv([{ name: '=HYPERLINK("http://evil.example")' }]);
    expect(result).toContain("'=HYPERLINK");
  });

  it('should return empty string for empty array', () => {
    const data: unknown[] = [];
    const result = formatCsv(data);

    expect(result).toBe('');
  });
});
