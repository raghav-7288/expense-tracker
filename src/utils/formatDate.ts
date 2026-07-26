/** Parse a YYYY-MM-DD string into a local Date (avoids timezone shift). */
function parseLocalDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/** Format to local YYYY-MM-DD from a Date object (timezone-safe). */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDate(dateString));
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parseLocalDate(dateString));
}

export function getToday(): string {
  return toISODate(new Date());
}

export function getMonthStart(): string {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function getMonthEnd(): string {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

export function getMonthName(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseLocalDate(dateString));
}

