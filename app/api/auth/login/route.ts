import { NextResponse } from 'next/server';
import { JwtUtils } from '@/lib/jwt';
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

    // Test kullanıcıları - production'da veritabanından alınacak
    const testUsers = [
      { 
        id: '1', 
        email: 'admin@restaurant.com', 
        password: await bcrypt.hash('password123', 10), 
        name: 'Admin User', 
        roleId: 1 
      },
      { 
        id: '2', 
        email: 'manager@restaurant.com', 
        password: await bcrypt.hash('password123', 10), 
        name: 'Restaurant Manager', 
        roleId: 2 
      },
      { 
        id: '3', 
        email: 'staff@restaurant.com', 
        password: await bcrypt.hash('password123', 10), 
        name: 'Kitchen Staff', 
        roleId: 3 
      },
    ];

    const user = testUsers.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz e-posta veya şifre' 
        },
        { status: 401 }
      );
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);
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
      roleId: user.roleId
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
        roleId: user.roleId,
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