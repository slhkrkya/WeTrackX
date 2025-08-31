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
    let message = `İstek başarısız (${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        // Backend'den gelen hata mesajını kullan
        message = text;
      } else {
        // HTTP status koduna göre genel mesajlar
        switch (res.status) {
          case 400:
            message = 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
            break;
          case 401:
            message = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
            break;
          case 403:
            message = 'Bu işlem için yetkiniz bulunmuyor.';
            break;
          case 404:
            message = 'İstenen kaynak bulunamadı.';
            break;
          case 500:
            message = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
            break;
          default:
            message = `Beklenmeyen bir hata oluştu (${res.status})`;
        }
      }
    } catch {
      message = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }
    // "any" kullanmadan Error nesnesi fırlat
    throw new Error(message);
  }

  // Response'un boş olup olmadığını kontrol et
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json() as Promise<T>;
    } catch {
      // JSON parse hatası durumunda boş response olarak kabul et
      return {} as T;
    }
  }
  
  // JSON response değilse boş object döndür
  return {} as T;
}