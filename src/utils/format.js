const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date);
}

export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

export function toLocalInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromLocalInputValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatWindow(from, to) {
  return `${formatDateTime(from)} → ${formatDateTime(to)}`;
}

export function plural(count, singular, pluralForm) {
  return `${count} ${count > 1 ? (pluralForm ?? `${singular}s`) : singular}`;
}

export const EXAM_STATUS = {
  UPCOMING: { label: 'À venir', tone: 'neutral' },
  OPEN: { label: 'Ouvert', tone: 'open' },
  CLOSED: { label: 'Terminé', tone: 'closed' },
};
