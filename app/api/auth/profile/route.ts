import { NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updated@restaurant.com"
 *               currentPassword:
 *                 type: string
 *                 description: Required if changing password
 *                 example: "currentPassword123"
 *               newPassword:
 *                 type: string
 *                 description: New password (optional)
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profil başarıyla güncellendi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1"
 *                     email:
 *                       type: string
 *                       example: "updated@restaurant.com"
 *                     name:
 *                       type: string
 *                       example: "Updated Name"
 *                     roleId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Define the user type to include password
interface TestUser {
  id: string;
  email: string;
  name: string;
  roleId: number;
  createdAt: string;
  password?: string; // Optional because it's not always present in responses
}

// Test kullanıcıları - production'da veritabanından alınacak
const testUsers: TestUser[] = [
  { 
    id: '1', 
    email: 'admin@restaurant.com', 
    name: 'Admin User', 
    roleId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    password: 'password123' // Default password for testing
  },
  { 
    id: '2', 
    email: 'manager@restaurant.com', 
    name: 'Restaurant Manager', 
    roleId: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    password: 'password123' // Default password for testing
  },
  { 
    id: '3', 
    email: 'staff@restaurant.com', 
    name: 'Kitchen Staff', 
    roleId: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    password: 'password123' // Default password for testing
  },
];

// GET - Get user profile
export const GET = AuthMiddleware.withAuth(async (request: any) => {
  try {
    console.log('Getting profile for user:', request.user);
    
    const user = testUsers.find(u => u.id === request.user.userId);
    
    if (!user) {
      console.log('User not found:', request.user.userId);
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    console.log('Found user:', user);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Profil bilgileri alınamadı' },
      { status: 500 }
    );
  }
});

// PUT - Update user profile
export const PUT = AuthMiddleware.withAuth(async (request: any) => {
  try {
    const { name, email, currentPassword, newPassword } = await request.json();
    console.log('PUT request data:', { name, email, currentPassword: !!currentPassword, newPassword: !!newPassword });

    if (!name || !email) {
      console.log('Missing name or email');
      return NextResponse.json(
        { success: false, error: 'Ad ve e-posta gereklidir' },
        { status: 400 }
      );
    }

    const user = testUsers.find(u => u.id === request.user.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Parola değiştirme kontrolü
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Parola değiştirmek için mevcut parola gereklidir' },
          { status: 400 }
        );
      }

      // Mevcut parola kontrolü
      const isPasswordValid = user.password === currentPassword; // Simple comparison for test environment
      // In a real app with hashed passwords, we would use: await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Mevcut parola yanlış' },
          { status: 400 }
        );
      }

      // Yeni parola uzunluk kontrolü
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Yeni parola en az 6 karakter olmalıdır' },
          { status: 400 }
        );
      }
    }

    // E-posta benzersizlik kontrolü (aynı kullanıcı hariç)
    const existingUserWithEmail = testUsers.find(u => u.email === email && u.id !== request.user.userId);
    if (existingUserWithEmail) {
      return NextResponse.json(
        { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Update the user in the testUsers array
    const userIndex = testUsers.findIndex(u => u.id === request.user.userId);
    if (userIndex !== -1) {
      // Update basic profile information
      testUsers[userIndex].name = name;
      testUsers[userIndex].email = email;
      
      // Update password if provided
      if (newPassword) {
        // For test environment, just store the password directly
        // In a real app, we would hash the password
        testUsers[userIndex].password = newPassword;
      }
      
      console.log('User data updated in memory:', {
        id: testUsers[userIndex].id,
        name: testUsers[userIndex].name,
        email: testUsers[userIndex].email,
        roleId: testUsers[userIndex].roleId,
        passwordChanged: newPassword ? true : false
      });
    }
    
    console.log('Updating user profile successfully');
    return NextResponse.json({
      success: true,
      message: newPassword ? 'Profil ve parola başarıyla güncellendi' : 'Profil başarıyla güncellendi',
      user: {
        id: user.id,
        email: email,
        name: name,
        roleId: user.roleId
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Profil güncellenemedi' },
      { status: 500 }
    );
  }
});