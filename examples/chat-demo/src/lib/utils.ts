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
