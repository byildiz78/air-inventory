import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasPermission } from './lib/auth-utils';

// Middleware for permission checking
export async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (pathname === '/login' || pathname === '/register' || pathname === '/api/auth') {
    return NextResponse.next();
  }

  // Get the user from the session (this is a simplified example)
  // In a real app, you would use a proper auth solution like NextAuth.js
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    // Redirect to login if no user is found
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Map paths to required permissions
  const permissionMap: Record<string, { module: string; permission: string }> = {
    '/dashboard': { module: 'dashboard', permission: 'view' },
    '/inventory': { module: 'inventory', permission: 'view' },
    '/recipes': { module: 'recipes', permission: 'view' },
    '/invoices': { module: 'invoices', permission: 'view' },
    '/sales': { module: 'sales', permission: 'view' },
    '/reports': { module: 'reports', permission: 'view' },
    '/users': { module: 'users', permission: 'view' },
    '/settings': { module: 'settings', permission: 'view' },
  };

  // Find the most specific permission required for this path
  let requiredPermission = null;
  for (const [path, permission] of Object.entries(permissionMap)) {
    if (pathname.startsWith(path)) {
      requiredPermission = permission;
      break;
    }
  }

  if (requiredPermission) {
    // Check if the user has the required permission
    const hasAccess = await hasPermission(
      userId,
      requiredPermission.module,
      requiredPermission.permission
    );

    if (!hasAccess) {
      // Redirect to dashboard or show an error page
      return NextResponse.redirect(new URL('/dashboard?error=permission', request.url));
    }
  }

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
     * - api routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};