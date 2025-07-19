import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_SECRET_KEY: string = JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  roleId: number;
  iat?: number;
  exp?: number;
}

export class JwtUtils {
  /**
   * Generate JWT token
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return (jwt as any).sign(payload, JWT_SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = (jwt as any).verify(token, JWT_SECRET_KEY) as JwtPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = (jwt as any).decode(token) as JwtPayload;
      if (!decoded || !decoded.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = (jwt as any).decode(token) as JwtPayload;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}