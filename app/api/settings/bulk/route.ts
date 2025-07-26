import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

// POST /api/settings/bulk - Create or update multiple settings at once
export async function POST(request: NextRequest) {
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
    const results: any[] = [];
    const errors: string[] = [];

    // Use transaction for bulk operations
    const savedSettings = await prisma.$transaction(async (tx) => {
      const transactionResults: any[] = [];

      for (const settingData of settings) {
        const { key, value, type = 'STRING' } = settingData;

        try {
          if (!key) {
            errors.push(`Setting key is required for: ${JSON.stringify(settingData)}`);
            continue;
          }

          if (!validTypes.includes(type)) {
            errors.push(`Invalid setting type '${type}' for key: ${key}`);
            continue;
          }

          // Validate value based on type
          let validatedValue = value;
          switch (type) {
            case 'NUMBER':
              if (value === '' || value === null || value === undefined) {
                validatedValue = '0';
              } else if (isNaN(Number(value))) {
                errors.push(`Invalid number value '${value}' for key: ${key}`);
                continue;
              } else {
                validatedValue = value.toString();
              }
              break;
            case 'BOOLEAN':
              if (typeof value === 'boolean') {
                validatedValue = value.toString();
              } else if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) {
                validatedValue = value.toLowerCase();
              } else {
                errors.push(`Invalid boolean value '${value}' for key: ${key}`);
                continue;
              }
              break;
            case 'JSON':
              try {
                if (typeof value === 'string') {
                  JSON.parse(value);
                  validatedValue = value;
                } else {
                  validatedValue = JSON.stringify(value);
                }
              } catch {
                errors.push(`Invalid JSON value for key: ${key}`);
                continue;
              }
              break;
            default: // STRING
              validatedValue = value?.toString() || '';
          }

          const setting = await tx.setting.upsert({
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

          transactionResults.push(setting);
        } catch (error) {
          console.error(`Failed to save setting ${key}:`, error);
          errors.push(`Failed to save setting ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return transactionResults;
    });

    // Log the operation
    console.log(`💾 Bulk settings save completed:
      - Total requested: ${settings.length}
      - Successfully saved: ${savedSettings.length}
      - Errors: ${errors.length}
    `);

    if (errors.length > 0) {
      console.warn('Settings save errors:', errors);
    }

    return NextResponse.json({
      success: true,
      data: savedSettings,
      message: `${savedSettings.length} of ${settings.length} settings saved successfully`,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total: settings.length,
        saved: savedSettings.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Bulk settings save error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}