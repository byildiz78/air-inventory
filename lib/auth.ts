import { NextRequest } from 'next/server';
import { AuthMiddleware, AuthenticatedRequest } from './auth-middleware';
import { JwtPayload } from './jwt';

/**
 * Simple authentication helper function
 * @param request - The NextRequest object
 * @returns User data if authenticated, null if not
 */
export async function authenticateToken(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const authResult = await AuthMiddleware.verifyToken(request);
    
    if (authResult.success && authResult.user) {
      return authResult.user;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get current user from authenticated request
 * @param request - The authenticated request
 * @returns User data
 */
export function getCurrentUser(request: AuthenticatedRequest): JwtPayload | null {
  return request.user || null;
}

/**
 * Check if user has required role
 * @param user - User data
 * @param requiredRoleId - Minimum required role ID
 * @returns Boolean indicating if user has required role
 */
export function hasRole(user: JwtPayload, requiredRoleId: number): boolean {
  return user.roleId >= requiredRoleId;
}

/**
 * Check if user is admin
 * @param user - User data
 * @returns Boolean indicating if user is admin
 */
export function isAdmin(user: JwtPayload): boolean {
  return user.roleId >= 3; // Assuming ADMIN role has ID 3
}

/**
 * Check if user is manager or higher
 * @param user - User data
 * @returns Boolean indicating if user is manager or higher
 */
export function isManager(user: JwtPayload): boolean {
  return user.roleId >= 2; // Assuming MANAGER role has ID 2
}