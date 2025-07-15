import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Basit test için sabit kullanıcıları kontrol et
    const testUsers = [
      { id: 1, email: 'admin@restaurant.com', password: 'password123', name: 'Admin User', roleId: 1 },
      { id: 2, email: 'manager@restaurant.com', password: 'password123', name: 'Restaurant Manager', roleId: 2 },
      { id: 3, email: 'staff@restaurant.com', password: 'password123', name: 'Kitchen Staff', roleId: 3 },
    ];

    const user = testUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}