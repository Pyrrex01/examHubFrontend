

const BASE_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

let getToken = () => null;
let onUnauthorized = () => {};

export function configureApi(options = {}) {
  if (typeof options.getToken === 'function') getToken = options.getToken;
  if (typeof options.onUnauthorized === 'function') onUnauthorized = options.onUnauthorized;
}

function isAccountDisabled(status, message) {
  return status === 403 && /d[ée]sactiv/i.test(message);
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, signal, auth = true } = options;

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;

    throw new ApiError(
      0,
      "Le serveur est injoignable. Vérifiez que l'API est démarrée, puis réessayez.",
    );
  }

  const text = await response.text();
  let payload = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(response.status, 'Réponse illisible du serveur.');
    }
  }

  if (response.ok) return payload;

  const message =
    payload && typeof payload.message === 'string'
      ? payload.message
      : `Erreur ${response.status}.`;

  if (response.status === 401 || isAccountDisabled(response.status, message)) {
    onUnauthorized(message);
  }

  throw new ApiError(response.status, message);
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};

export { BASE_URL };
