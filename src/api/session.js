const STORAGE_KEY = 'examhub.session';

function storage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isValidSession(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.token === 'string' &&
    value.token.length > 0 &&
    value.user !== null &&
    typeof value.user === 'object' &&
    (value.user.role === 'ADMIN' || value.user.role === 'STUDENT')
  );
}

export function readSession() {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    store.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session) {
  const store = storage();
  if (!store) return;
  store.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  const store = storage();
  if (!store) return;
  store.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY, isValidSession };
