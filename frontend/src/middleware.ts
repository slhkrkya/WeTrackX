import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Korumalı rotalar (giriş gerektiren)
const protectedRoutes = [
  '/dashboard',
  '/accounts',
  '/categories', 
  '/transactions',
  '/reports',
  '/profile'
];

// Public rotalar (giriş gerektirmeyen)
// const publicRoutes = [
//   '/',
//   '/auth/login',
//   '/auth/register'
// ];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // JWT token'ı kontrol et
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!token;

  // Anasayfa için özel kontrol - giriş yapmış kullanıcılar anasayfada kalabilir
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Auth sayfaları için kontrol
  if (pathname.startsWith('/auth/')) {
    // Giriş yapmış kullanıcı auth sayfalarına gelirse dashboard'a yönlendir
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Giriş yapmamış kullanıcı auth sayfalarında kalabilir
    return NextResponse.next();
  }

  // Korumalı rotalar için kontrol
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Giriş yapmamış kullanıcı korumalı sayfalara gelirse anasayfaya yönlendir
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Giriş yapmış kullanıcı korumalı sayfalarda kalabilir
    return NextResponse.next();
  }

  // Diğer tüm rotalar için anasayfaya yönlendir
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
