import { NextResponse } from 'next/server';
import { posApiClient } from '@/lib/services/pos-api-client';

export async function GET() {
  try {
    console.log('🔍 Testing POS connection...');
    
    const isConnected = await posApiClient.testConnection();
    const lastSync = await posApiClient.getLastSyncTime();

    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        lastSyncTime: lastSync,
        message: isConnected ? 'Connection successful' : 'Connection failed'
      }
    });
  } catch (error) {
    console.error('❌ POS connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          connected: false,
          lastSyncTime: null,
          message: 'Connection test failed'
        }
      },
      { status: 500 }
    );
  }
}