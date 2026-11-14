import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBookmark, generateSlug, loadBookmarks, normalizeUrl } from './bookmarks.ts';

test('normalizes a URL with or without https:// to the same value', () => {
  assert.equal(
    normalizeUrl('www.example.com'),
    normalizeUrl('https://www.example.com'),
  );
});

test('recovers from empty, corrupted, legacy, and non-array saved values', () => {
  const invalidValues = [
    null,
    '',
    '[]',
    'not json',
    JSON.stringify(['https://old.example']),
    JSON.stringify({ url: 'https://example.com' }),
  ];
  for (const raw of invalidValues) {
    assert.doesNotThrow(() => loadBookmarks(raw));
    assert.deepEqual(loadBookmarks(raw), []);
  }
});

test('drops malformed entries from an otherwise valid bookmark array', () => {
  assert.deepEqual(
    loadBookmarks(JSON.stringify([
      { url: 'https://www.example.com', slug: 'mona-7fk2' },
      { url: 'javascript:alert(1)', slug: 'mona-abcd' },
      { url: 'https://invalid.example', slug: 'not-a-mona-slug' },
    ])),
    [{ url: 'https://www.example.com', slug: 'mona-7fk2' }],
  );
});

test('formats a saved bookmark with the exact visible separator', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});

test('generates a short base62 slug and avoids existing slugs', () => {
  const slug = generateSlug(['mona-0000'], 0);
  assert.equal(slug, 'mona-0001');
  assert.match(slug, /^mona-[0-9a-zA-Z]{4}$/);
});
