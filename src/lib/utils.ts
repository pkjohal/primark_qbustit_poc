import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  subDays,
  parseISO,
} from 'date-fns';

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy, HH:mm');
}

/**
 * Returns relative time (e.g. "2 hours ago") for dates within 7 days,
 * otherwise returns formatted date.
 */
export function formatRelativeTime(iso: string): string {
  const date = parseISO(iso);
  const sevenDaysAgo = subDays(new Date(), 7);
  if (
    isWithinInterval(date, { start: sevenDaysAgo, end: new Date() })
  ) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return formatDateTime(iso);
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'dd/MM');
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
