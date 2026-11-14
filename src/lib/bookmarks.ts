export interface Bookmark {
  url: string;
  slug: string;
}

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLUG_SPACE = BASE62.length ** 4;

export function normalizeUrl(value: string): string {
  const input = value.trim();
  if (!input) {
    throw new TypeError('Enter a URL to save.');
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input);
  const candidate = hasScheme
    ? input
    : input.startsWith('//')
      ? `https:${input}`
      : `https://${input}`;
  const url = new URL(candidate);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Enter an HTTP or HTTPS URL.');
  }
  if (!url.hostname) {
    throw new TypeError('Enter a valid URL.');
  }

  return url.pathname === '/' && !url.search && !url.hash
    ? url.href.slice(0, -1)
    : url.href;
}

export function generateSlug(existingSlugs: Iterable<string>, randomValue = Math.random()): string {
  const used = new Set(existingSlugs);
  const safeRandomValue = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
    : 0;
  let value = Math.floor(safeRandomValue * SLUG_SPACE);

  while (true) {
    let remainder = value;
    let suffix = '';
    do {
      suffix = BASE62[remainder % BASE62.length] + suffix;
      remainder = Math.floor(remainder / BASE62.length);
    } while (remainder > 0);

    const slug = `mona-${suffix.padStart(4, '0')}`;
    if (!used.has(slug)) {
      return slug;
    }
    value += 1;
  }
}

export function loadBookmarks(raw: string | null): Bookmark[] {
  if (!raw?.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const bookmarks: Bookmark[] = [];
  for (const entry of parsed) {
    const bookmark = validateBookmark(entry);
    if (bookmark) {
      bookmarks.push(bookmark);
    }
  }
  return bookmarks;
}

export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}

function validateBookmark(value: unknown): Bookmark | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as { url?: unknown; slug?: unknown };
  if (
    typeof candidate.url !== 'string'
    || typeof candidate.slug !== 'string'
    || !/^mona-[0-9a-zA-Z]{4,}$/.test(candidate.slug)
  ) {
    return null;
  }

  try {
    return { url: normalizeUrl(candidate.url), slug: candidate.slug };
  } catch {
    return null;
  }
}
