import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useState, useEffect } from 'react';

export interface Permission {
  name: string;
  description: string;
  resource_type: string;
  action: string;
}

export interface UserPermissions {
  role: string;
  permissions: Permission[];
}

/**
 * Hook to get current user's permissions
 */
export const usePermissions = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  return useQuery<UserPermissions>({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      
      const response = await apiClient.get(`/permissions/user/${userId}`);
      return response.data.data;
    },
    enabled: !!userId,
  });
};

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permissionName: string) => {
  const { data: userPermissions, isLoading } = usePermissions();

  const hasPermission = userPermissions?.permissions?.some(
    (p) => p.name === permissionName
  ) || false;

  return { hasPermission, isLoading, role: userPermissions?.role };
};

/**
 * Hook to check multiple permissions
 */
export const useHasPermissions = (permissionNames: string[]) => {
  const { data: userPermissions, isLoading } = usePermissions();

  const permissions = permissionNames.reduce((acc, permName) => {
    acc[permName] = userPermissions?.permissions?.some(
      (p) => p.name === permName
    ) || false;
    return acc;
  }, {} as Record<string, boolean>);

  return { permissions, isLoading, role: userPermissions?.role };
};

/**
 * Hook to check if user is admin
 */
export const useIsAdmin = () => {
  const { data: userPermissions, isLoading } = usePermissions();
  
  const isAdmin = userPermissions?.role === 'admin' || 
                  userPermissions?.role === 'super-admin';
  
  return { isAdmin, isLoading, role: userPermissions?.role };
};

/**
 * Hook to check if user is super admin
 */
export const useIsSuperAdmin = () => {
  const { data: userPermissions, isLoading } = usePermissions();
  
  const isSuperAdmin = userPermissions?.role === 'super-admin';
  
  return { isSuperAdmin, isLoading };
};

/**
 * Get all available roles and their permissions
 */
export const useAllRoles = () => {
  return useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const response = await apiClient.get('/permissions/roles');
      return response.data.data;
    },
  });
};
