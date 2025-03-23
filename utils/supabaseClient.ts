import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Create client-side Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  // Only create the client once
  if (supabaseInstance) return supabaseInstance;
  
  // Make sure we have the required config
  if (!config.supabase.client.url || !config.supabase.client.anonKey) {
    // Log error but don't throw during rendering
    console.error('Missing Supabase client credentials');
    
    // Return a minimal mock to prevent rendering errors
    if (typeof window !== 'undefined') {
      return createClient('https://placeholder-url.supabase.co', 'placeholder-key');
    }
  }
  
  // Create the real client
  supabaseInstance = createClient(
    config.supabase.client.url,
    config.supabase.client.anonKey
  );
  
  return supabaseInstance;
})();