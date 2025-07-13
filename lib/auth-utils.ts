import { User, Permission } from '@prisma/client';
import { prisma } from './prisma';

// Check if a user has a specific permission
export async function hasPermission(
  userId: string,
  moduleCode: string,
  permissionCode: string
): Promise<boolean> {
  // Super admin has all permissions
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.isActive) {
    return false;
  }

  if (user.isSuperAdmin) {
    return true;
  }

  // Check specific permission
  const permission = await prisma.permission.findFirst({
    where: {
      module: {
        code: moduleCode
      },
      code: permissionCode,
      userPermissions: {
        some: {
          userId: userId
        }
      }
    }
  });

  return !!permission;
}

// Get all permissions for a user
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPermissions: {
        include: {
          permission: {
            include: {
              module: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    return [];
  }

  if (user.isSuperAdmin) {
    // Super admin has all permissions
    return await prisma.permission.findMany({
      include: {
        module: true
      }
    });
  }

  return user.userPermissions.map(up => up.permission);
}

// Log user activity
export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: any,
  req?: any
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress,
        userAgent: req?.headers?.['user-agent']
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Initialize default modules and permissions
export async function initializePermissions() {
  const modules = [
    { name: 'Dashboard', code: 'dashboard', description: 'Ana dashboard' },
    { name: 'Stok Yönetimi', code: 'inventory', description: 'Stok ve malzeme yönetimi' },
    { name: 'Reçeteler', code: 'recipes', description: 'Reçete yönetimi' },
    { name: 'Faturalar', code: 'invoices', description: 'Fatura yönetimi' },
    { name: 'Satışlar', code: 'sales', description: 'Satış yönetimi' },
    { name: 'Raporlar', code: 'reports', description: 'Raporlama modülü' },
    { name: 'Kullanıcılar', code: 'users', description: 'Kullanıcı yönetimi' },
    { name: 'Ayarlar', code: 'settings', description: 'Sistem ayarları' },
  ];

  const permissionTypes = [
    { name: 'Görüntüleme', code: 'view', description: 'Görüntüleme yetkisi' },
    { name: 'Ekleme', code: 'create', description: 'Ekleme yetkisi' },
    { name: 'Düzenleme', code: 'edit', description: 'Düzenleme yetkisi' },
    { name: 'Silme', code: 'delete', description: 'Silme yetkisi' },
  ];

  // Create modules
  for (const module of modules) {
    const existingModule = await prisma.module.findUnique({
      where: { code: module.code }
    });

    if (!existingModule) {
      const createdModule = await prisma.module.create({
        data: module
      });

      // Create permissions for this module
      for (const permType of permissionTypes) {
        await prisma.permission.create({
          data: {
            moduleId: createdModule.id,
            name: `${module.name} ${permType.name}`,
            description: `${permType.description} - ${module.name}`,
            code: permType.code
          }
        });
      }
    }
  }

  console.log('Default permissions initialized');
}