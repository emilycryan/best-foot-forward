// src/lib/excerpt.test.ts
import { describe, it, expect } from 'vitest';
import { excerpt } from './excerpt';

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('Short body.', 50)).toBe('Short body.');
  });
  it('truncates on a word boundary with an ellipsis', () => {
    expect(excerpt('one two three four five six', 12)).toBe('one two…');
  });
  it('strips markdown emphasis and headings', () => {
    expect(excerpt('# Title\n\n**bold** and _em_ text', 100)).toBe('Title bold and em text');
  });
});
