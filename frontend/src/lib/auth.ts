export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

const TOKEN_KEY = 'wtx_token';
const USER_KEY = 'wtx_user';
const COOKIE_TOKEN_KEY = 'auth-token';

// Auth state change event system
type AuthStateListener = (isAuthenticated: boolean) => void;
const authListeners: AuthStateListener[] = [];

export function addAuthListener(listener: AuthStateListener) {
  authListeners.push(listener);
}

export function removeAuthListener(listener: AuthStateListener) {
  const index = authListeners.indexOf(listener);
  if (index > -1) {
    authListeners.splice(index, 1);
  }
}

function notifyAuthStateChange() {
  const authStatus = isAuthenticated();
  authListeners.forEach(listener => listener(authStatus));
}

export function setAuth(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  
  // LocalStorage'a kaydet
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // Cookie'ye de kaydet (middleware için)
  document.cookie = `${COOKIE_TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  
  // Auth state değişikliğini bildir
  notifyAuthStateChange();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  
  // LocalStorage'dan temizle
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Cookie'den de temizle
  document.cookie = `${COOKIE_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Auth state değişikliğini bildir
  notifyAuthStateChange();
}

export function isAuthenticated() {
  return !!getToken();
}