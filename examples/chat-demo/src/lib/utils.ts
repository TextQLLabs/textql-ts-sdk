export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** A trimmed string, or null when the value is absent, non-string, or blank. */
export function trimmedOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function storageGet(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Whether the `?debug` flag is present in the current URL. */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debug');
}

const sectionLabels: Record<string, string> = {
  '/': 'Home',
  '/blog': 'Blog',
  '/xyz': 'Components',
};

export function getRouteLabel(path: string): string {
  const normalized = path.replace(/\/$/, '') || '/';

  // Exact top-level route: use the mapped section label.
  if (sectionLabels[normalized]) return sectionLabels[normalized];

  // Nested route: build a breadcrumb from each segment, mapping the first
  // segment to its section label if one exists.
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';

  const mapped = segments.map((segment, index) => {
    if (index === 0) {
      const prefix = '/' + segment;
      return sectionLabels[prefix] ?? capitalize(segment);
    }
    return capitalize(segment);
  });

  return mapped.join(' / ');
}

function capitalize(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
