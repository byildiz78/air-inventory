import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify the validity of a JWT token and return user information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "1"
 *                     email:
 *                       type: string
 *                       example: "admin@restaurant.com"
 *                     name:
 *                       type: string
 *                       example: "Admin User"
 *                     roleId:
 *                       type: integer
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "Token geçerli"
 *       401:
 *         description: Token is invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Token süresi dolmuş"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Token doğrulama hatası"
 */

export const GET = AuthMiddleware.withAuth(async (request) => {
  try {
    const user = request.user!;
    
    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
      },
      message: 'Token geçerli'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token doğrulama hatası' 
      },
      { status: 500 }
    );
  }
});