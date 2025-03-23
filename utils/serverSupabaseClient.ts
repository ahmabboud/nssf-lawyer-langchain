import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Creates a Supabase client with server-side credentials
 * This should only be used in server contexts (API routes, server components, etc.)
 */
export function createServerSupabaseClient() {
  // Ensure we're on the server
  if (typeof window !== 'undefined') {
    throw new Error('createServerSupabaseClient should only be called on the server');
  }
  
  // Validate server-side credentials are available
  if (!config.supabase.server.url) {
    throw new Error('Missing Supabase URL for server-side client');
  }
  
  if (!config.supabase.server.serviceKey) {
    throw new Error('Missing Supabase service key for server-side client');
  }
  
  return createClient(
    config.supabase.server.url,
    config.supabase.server.serviceKey
  );
}