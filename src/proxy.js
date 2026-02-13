import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    if (isAuthenticated) {
      // Redirect authenticated users to their dashboard
      if (userRole === 'CHAIRMAN') {
        return NextResponse.redirect(new URL('/chairman/dashboard', req.url));
      } else if (userRole === 'CASHIER') {
        return NextResponse.redirect(new URL('/cashier/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based access control
  if (pathname.startsWith('/chairman') && userRole !== 'CHAIRMAN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/cashier') && !['CASHIER', 'WAITER'].includes(userRole)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
