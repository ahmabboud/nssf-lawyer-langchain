import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'pro' | 'free';

export interface UserData {
  id: string;
  email: string;
  role?: UserRole;
  created_at?: string;
}

interface DbUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

const TIMEOUT_MS = 5000; // 5 second timeout

// Updated withTimeout function to handle both promise types
const withTimeout = <T>(promise: any, timeoutMs: number): Promise<any> => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ]);
};

export async function fetchUsers(): Promise<UserData[]> {
  try {
    toast.info('Fetching users...');
    const { data: users, error } = await withTimeout<DbUser>(
      supabase
        .from('user_management_view')
        .select('*'),
      TIMEOUT_MS
    );

    if (error) {
      toast.error(`Failed to fetch users: ${error.message}`);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
    
    const mappedUsers = (users || []).map((user: DbUser) => ({
      id: user.id,
      email: user.email,
      role: user.role || 'free',
      created_at: user.created_at
    }));
    toast.success(`Loaded ${mappedUsers.length} users`);
    return mappedUsers;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while fetching users';
    toast.error('Failed to load users');
    throw error;
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    toast.info(`Updating user role...`);
    
    // Get the role ID for the given role name from public.roles
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', role)
      .single();

    if (roleError) {
      toast.error(`Failed to find role`);
      throw new Error(`Failed to find role: ${roleError.message}`);
    }

    if (!roleData) {
      toast.error(`Role not found`);
      throw new Error(`Role "${role}" not found in the database`);
    }

    const roleId = roleData.id;
    
    // Using upsert to update public.user_roles table
    const { error: upsertError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id'
      });

    if (upsertError) {
      toast.error(`Failed to update role`);
      throw new Error(`Failed to update role: ${upsertError.message}`);
    }
    
    toast.success(`Role updated successfully`);
    return true;
  } catch (error: any) {
    toast.error('Failed to update user role');
    throw new Error(error?.message || 'Failed to update user role');
  }
}

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Execute the query directly without Promise.resolve() wrapper
    const { data, error } = await withTimeout(
      supabase
        .from('user_management_view')
        .select('role')
        .eq('id', userId)
        .single(),
      TIMEOUT_MS
    );

    if (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
    
    return (data?.role as UserRole) || 'free';
  } catch (error) {
    // Default to free access level if we can't determine the role
    return 'free';
  }
}