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

/** Get the start of the current week (Monday). */
export function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  // Shift so Monday = 0
  const diff = (day === 0 ? 6 : day - 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return toISODate(monday);
}

/** Get the end of the current week (Sunday). */
export function getWeekEnd(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return toISODate(sunday);
}

