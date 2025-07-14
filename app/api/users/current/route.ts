import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Geçici olarak sabit bir kullanıcı ID'si kullanıyoruz
// Gerçek uygulamada bu, oturum yönetimi ile belirlenecektir
const CURRENT_USER_ID = '1';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: CURRENT_USER_ID
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı bilgileri alınamadı' },
      { status: 500 }
    );
  }
}
