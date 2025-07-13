'use client';

import { ReactNode, useEffect, useState } from 'react';
import { hasPermission } from '@/lib/auth-utils';

interface PermissionGuardProps {
  children: ReactNode;
  moduleCode: string;
  permissionCode: string;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render children based on user permissions
 */
export function PermissionGuard({
  children,
  moduleCode,
  permissionCode,
  fallback = null
}: PermissionGuardProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        // In a real app, you would get the userId from your auth context
        const userId = localStorage.getItem('userId') || '1'; // Default to admin for demo
        
        // Check if the user has the required permission
        const access = await hasPermission(userId, moduleCode, permissionCode);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [moduleCode, permissionCode]);

  if (loading) {
    // You could return a loading indicator here
    return null;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}