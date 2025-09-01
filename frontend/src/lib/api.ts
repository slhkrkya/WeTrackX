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
  init?: RequestInit & { 
    jsonBody?: JsonValue;
    timeout?: number;
    signal?: AbortSignal;
  }
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${base}${path}`;
  const token = typeof window !== 'undefined' ? getToken() : null;
  const timeout = init?.timeout || 30000; // 30 saniye default timeout

  // AbortController oluştur
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Eğer dışarıdan signal geliyorsa, onu da dinle
  if (init?.signal) {
    init.signal.addEventListener('abort', () => controller.abort());
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      body: init?.jsonBody !== undefined ? JSON.stringify(init.jsonBody) : init?.body,
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Hata mesajını okunur hale getirme
      let message = `İstek başarısız (${res.status})`;
      try {
        const text = await res.text();
        if (text) {
          // JSON formatında gelip gelmediğini kontrol et
          try {
            const errorData = JSON.parse(text);
            // Backend'den gelen message field'ını kullan
            if (errorData.message) {
              message = errorData.message;
            } else if (errorData.error) {
              message = errorData.error;
            } else {
              message = text;
            }
          } catch {
            // JSON değilse direkt text'i kullan
            message = text;
          }
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
  } catch (error) {
    clearTimeout(timeoutId);
    
    // AbortError kontrolü
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    
    // Network error kontrolü
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
    }
    
    // Diğer hataları yeniden fırlat
    throw error;
  }
}