import { getToken } from './auth';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { jsonBody?: JsonValue }
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${base}${path}`;
  const token = typeof window !== 'undefined' ? getToken() : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.jsonBody !== undefined ? JSON.stringify(init.jsonBody) : init?.body,
    cache: 'no-store',
  });

  if (!res.ok) {
    // Hata mesajını okunur hale getirme
    let message = `Request failed (${res.status})`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      /* ignore */
    }
    // "any" kullanmadan Error nesnesi fırlat
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}