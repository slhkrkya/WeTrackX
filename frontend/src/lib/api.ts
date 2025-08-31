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

  // Response'un boş olup olmadığını kontrol et
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json() as Promise<T>;
    } catch (error) {
      // JSON parse hatası durumunda boş response olarak kabul et
      return {} as T;
    }
  }
  
  // JSON response değilse boş object döndür
  return {} as T;
}