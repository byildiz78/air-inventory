import { NextResponse } from 'next/server';
import { posSyncService } from '@/lib/services/pos-sync-service';

export async function POST() {
  try {
    console.log('🚀 Starting POS synchronization...');
    
    const result = await posSyncService.performSync();

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message,
          data: result
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}