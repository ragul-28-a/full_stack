import { supabase } from './supabaseClient';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, { method = 'GET', body, file } = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Please sign in to access workspace data.');
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  let requestBody = body;

  if (file) {
    requestBody = new FormData();
    requestBody.append('file', file);
    Object.entries(body || {}).forEach(([key, value]) => {
      requestBody.append(key, String(value));
    });
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/${path}`, {
    method,
    headers,
    body: requestBody
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `API request failed (${response.status}).`);
  }

  return payload?.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, file, fields = {}) => request(path, { method: 'POST', file, body: fields })
};
