import { NextRequest, NextResponse } from 'next/server';
import { JwtUtils, JwtPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

export class AuthMiddleware {
  /**
   * Middleware function to verify JWT token
   */
  static async verifyToken(request: NextRequest): Promise<{ 
    success: boolean; 
    user?: JwtPayload; 
    error?: string; 
  }> {
    try {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        return {
          success: false,
          error: 'Authorization header eksik'
        };
      }

      const token = JwtUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return {
          success: false,
          error: 'Geçersiz authorization header formatı'
        };
      }

      // Token'ın süresi dolmuş mu kontrol et
      if (JwtUtils.isTokenExpired(token)) {
        return {
          success: false,
          error: 'Token süresi dolmuş'
        };
      }

      // Token'ı doğrula
      const user = JwtUtils.verifyToken(token);
      
      if (!user) {
        return {
          success: false,
          error: 'Geçersiz token'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Auth middleware error:', error);
      return {
        success: false,
        error: 'Authentication hatası'
      };
    }
  }

  /**
   * Create protected route wrapper
   */
  static withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = await AuthMiddleware.verifyToken(request);
      
      if (!authResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: authResult.error || 'Unauthorized' 
          },
          { status: 401 }
        );
      }

      // User bilgisini request'e ekle
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = authResult.user;

      return handler(authenticatedRequest);
    };
  }

  /**
   * Create role-based protected route wrapper
   */
  static withRole(requiredRoleId: number, handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = await AuthMiddleware.verifyToken(request);
      
      if (!authResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: authResult.error || 'Unauthorized' 
          },
          { status: 401 }
        );
      }

      // Role kontrolü
      if (authResult.user!.roleId < requiredRoleId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bu işlem için yetkiniz yok' 
          },
          { status: 403 }
        );
      }

      // User bilgisini request'e ekle
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = authResult.user;

      return handler(authenticatedRequest);
    };
  }

  /**
   * Optional auth - user bilgisini ekler ama zorunlu değil
   */
  static withOptionalAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = await AuthMiddleware.verifyToken(request);
      
      const authenticatedRequest = request as AuthenticatedRequest;
      
      if (authResult.success) {
        authenticatedRequest.user = authResult.user;
      }

      return handler(authenticatedRequest);
    };
  }
}