import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for basic auth checking
export async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get the user from the session (this is a simplified example)
  // In a real app, you would use a proper auth solution like NextAuth.js
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    // Redirect to login if no user is found
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Permission checking should be done at the page/API level, not in middleware
  // because middleware runs in Edge Runtime and cannot use Prisma

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};