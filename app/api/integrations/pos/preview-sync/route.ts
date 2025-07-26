import { NextResponse } from 'next/server';
import { posSyncService } from '@/lib/services/pos-sync-service';

export async function GET() {
  try {
    console.log('📋 Generating sync preview...');
    
    const preview = await posSyncService.previewSync();

    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('❌ Preview generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}