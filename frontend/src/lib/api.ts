export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { jsonBody?: any }
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${base}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  };
  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.jsonBody ? JSON.stringify(init.jsonBody) : init?.body,
    // Geliştirmede cache istemiyoruz
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}