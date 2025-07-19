import { NextRequest, NextResponse } from 'next/server';
import { JwtUtils } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "admin@restaurant.com"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
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
 *                 expiresIn:
 *                   type: string
 *                   description: Token expiration time
 *                   example: "24h"
 *       400:
 *         description: Bad request - missing email or password
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
 *                   example: "E-posta ve şifre gereklidir"
 *       401:
 *         description: Invalid credentials
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
 *                   example: "Geçersiz e-posta veya şifre"
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
 *                   example: "Giriş işlemi sırasında bir hata oluştu"
 */

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'E-posta ve şifre gereklidir' 
        },
        { status: 400 }
      );
    }

    console.log('Login attempt for email:', email);
    
    // Veritabanından kullanıcıyı e-posta ile bul
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          isSuperAdmin: true,
          isActive: true
        }
      });
      
      console.log('Database user lookup result:', user ? 'User found' : 'User not found');
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Veritabanı hatası oluştu' 
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('User not found with email:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz e-posta veya şifre' 
        },
        { status: 401 }
      );
    }
    
    // Kullanıcı aktif mi kontrolü
    if (user.isActive === false) {
      console.log('User account is inactive:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.' 
        },
        { status: 403 }
      );
    }

    // Şifre kontrolü
    console.log('Comparing password for user:', user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz e-posta veya şifre' 
        },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const token = JwtUtils.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.role === 'ADMIN' ? 1 : user.role === 'MANAGER' ? 2 : 3
    });

    // Token süresi
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role === 'ADMIN' ? 1 : user.role === 'MANAGER' ? 2 : 3,
        isSuperAdmin: user.isSuperAdmin,
        role: user.role
      },
      expiresIn
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Giriş işlemi sırasında bir hata oluştu' 
      },
      { status: 500 }
    );
  }
}