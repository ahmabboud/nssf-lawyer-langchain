import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import { PostgrestResponse } from '@supabase/supabase-js';

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

const withTimeout = <T>(promise: Promise<PostgrestResponse<T>>, timeoutMs: number): Promise<PostgrestResponse<T>> => {
  return Promise.race([
    promise,
    new Promise<PostgrestResponse<T>>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ]);
};

export async function fetchUsers(): Promise<UserData[]> {
  try {
    toast.info('Fetching users from database...');
    const { data: users, error } = await withTimeout<DbUser>(
      Promise.resolve(
        supabase
          .from('user_management_view')
          .select('*')
      ),
      TIMEOUT_MS
    );

    if (error) {
      console.error('Failed to fetch users:', error);
      toast.error(`Failed to fetch users: ${error.message}`);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
    
    const mappedUsers = (users || []).map((user: DbUser) => ({
      id: user.id,
      email: user.email,
      role: user.role || 'free',
      created_at: user.created_at
    }));
    toast.success(`Successfully fetched ${mappedUsers.length} users`);
    return mappedUsers;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while fetching users';
    console.error('fetchUsers error:', message);
    toast.error('Unexpected error while fetching users');
    throw error;
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    toast.info(`Updating role for user ${userId} to ${role}...`);
    console.log('Starting role update process for user:', userId);
    
    // Step 1: Debug - verify the tables we're working with
    const { data: tables } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .in('tablename', ['roles', 'user_roles'])
      .in('schemaname', ['public']);
      
    console.log('Available tables:', tables);
    
    // Step 2: Get the role ID for the given role name from public.roles
    console.log('Querying public.roles table for role:', role);
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', role)
      .single();

    if (roleError) {
      console.error('Error fetching role ID:', roleError);
      toast.error(`Failed to find role: ${roleError.message}`);
      throw new Error(`Failed to find role: ${roleError.message}`);
    }

    if (!roleData) {
      console.error('Role not found:', role);
      toast.error(`Role "${role}" not found in the database`);
      throw new Error(`Role "${role}" not found in the database`);
    }

    const roleId = roleData.id;
    console.log(`Found role ID ${roleId} for role "${roleData.name}" in public.roles table`);
    
    // Step 3: Check if a role already exists for this user
    console.log('Checking existing roles for user in public.user_roles table');
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing role:', checkError);
    } else {
      console.log('Current user role in public.user_roles:', existingRole);
    }
    
    // Step 4: Using upsert to update public.user_roles table
    console.log(`Upserting user role in public.user_roles: user_id=${userId}, role_id=${roleId}`);
    const { data, error: upsertError, status, statusText } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id'
      });

    console.log('Upsert response:', { status, statusText });

    if (upsertError) {
      console.error('Error updating role:', upsertError);
      toast.error(`Failed to update role: ${upsertError.message}`);
      throw new Error(`Failed to update role: ${upsertError.message}`);
    }
    
    // Step 5: Verify the update was successful
    console.log('Verifying update in public.user_roles table');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Verification result:', verifyData);
      if (verifyData.role_id === roleId) {
        console.log('Role update successful!');
      } else {
        console.warn('Role update may have failed. Expected role_id:', roleId, 'Got:', verifyData.role_id);
      }
    }
    
    toast.success(`Successfully updated user role to ${role}`);
    return true;
  } catch (error: any) {
    // More robust error handling
    const errorMessage = error?.message || 'Unexpected error while updating role';
    console.error('updateUserRole unexpected error:', error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    toast.info('Checking user role...');
    const { data, error } = await supabase
      .from('user_management_view')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get role error:', error);
      toast.error(`Failed to get user role: ${error.message}`);
      throw new Error(`Failed to get user role: ${error.message}`);
    }
    
    const role = (data?.role as UserRole) || 'free';
    toast.success(`User role: ${role}`);
    return role;
  } catch (error) {
    console.error('getUserRole error:', error);
    toast.error('Failed to verify user role, defaulting to free');
    return 'free';
  }
}