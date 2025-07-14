'use client';

import { ReactNode, useEffect, useState } from 'react';

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
        
        // Check permission via API
        const response = await fetch('/api/auth/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            moduleCode,
            permissionCode,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setHasAccess(result.hasAccess || false);
        } else {
          setHasAccess(false);
        }
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