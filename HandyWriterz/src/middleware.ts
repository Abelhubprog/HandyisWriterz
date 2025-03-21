import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/services',
    '/services/:id',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/admin/sign-in',
  ],
  afterAuth(auth, req) {
    // Handle public routes
    if (!auth.userId && auth.isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to sign in if not authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Handle admin routes
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isAdmin = auth.sessionClaims?.metadata?.role === 'admin';

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/auth/admin/sign-in', req.url));
    }

    // Allow access to protected routes for authenticated users
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
