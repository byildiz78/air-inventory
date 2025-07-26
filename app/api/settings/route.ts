import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

// GET /api/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update a single setting
export async function POST(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value, type = 'STRING' } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Validate setting type
    const validTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid setting type' },
        { status: 400 }
      );
    }

    // Validate value based on type
    let validatedValue = value;
    switch (type) {
      case 'NUMBER':
        if (isNaN(Number(value))) {
          return NextResponse.json(
            { success: false, error: 'Invalid number value' },
            { status: 400 }
          );
        }
        validatedValue = value.toString();
        break;
      case 'BOOLEAN':
        if (!['true', 'false'].includes(value.toLowerCase())) {
          return NextResponse.json(
            { success: false, error: 'Invalid boolean value' },
            { status: 400 }
          );
        }
        validatedValue = value.toLowerCase();
        break;
      case 'JSON':
        try {
          JSON.parse(value);
          validatedValue = value;
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid JSON value' },
            { status: 400 }
          );
        }
        break;
      default: // STRING
        validatedValue = value.toString();
    }

    // Create or update setting
    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: validatedValue,
        type: type as any
      },
      create: {
        key,
        value: validatedValue,
        type: type as any
      }
    });

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully'
    });

  } catch (error) {
    console.error('Setting save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update multiple settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    const validTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'];
    const results = [];

    // Process each setting
    for (const settingData of settings) {
      const { key, value, type = 'STRING' } = settingData;

      if (!key) {
        continue; // Skip invalid entries
      }

      if (!validTypes.includes(type)) {
        continue; // Skip invalid types
      }

      // Validate value based on type
      let validatedValue = value;
      switch (type) {
        case 'NUMBER':
          if (isNaN(Number(value))) continue;
          validatedValue = value.toString();
          break;
        case 'BOOLEAN':
          if (!['true', 'false'].includes(value.toLowerCase())) continue;
          validatedValue = value.toLowerCase();
          break;
        case 'JSON':
          try {
            JSON.parse(value);
            validatedValue = value;
          } catch {
            continue;
          }
          break;
        default: // STRING
          validatedValue = value.toString();
      }

      try {
        const setting = await prisma.setting.upsert({
          where: { key },
          update: {
            value: validatedValue,
            type: type as any
          },
          create: {
            key,
            value: validatedValue,
            type: type as any
          }
        });
        results.push(setting);
      } catch (error) {
        console.error(`Failed to save setting ${key}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} settings saved successfully`
    });

  } catch (error) {
    console.error('Bulk settings save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings?key=setting_key - Delete a setting
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    await prisma.setting.delete({
      where: { key }
    });

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    });

  } catch (error) {
    console.error('Setting delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}