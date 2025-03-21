// Configuration variables
export const config = {
  supabase: {
    // Client-side config needs NEXT_PUBLIC_ prefix
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || (() => { 
      throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable is required') 
    })(),
    // Private key should only be used server-side
    serviceKey: process.env.SUPABASE_PRIVATE_KEY || (() => { 
      throw new Error('SUPABASE_PRIVATE_KEY environment variable is required') 
    })(),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || (() => { 
      throw new Error('OPENAI_API_KEY environment variable is required') 
    })(),
    model: process.env.OPENAI_MODEL || "gpt-4",
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.2"),
  },
  auth: {
    defaultRedirectPath: '/',
    loginPath: '/auth',
    protectedPaths: ['/admin'],
    adminRole: 'admin',
  }
} as const;

// Type-safe environment variable validation
export function validateConfig() {
  // This function will be called automatically when accessing config values
  // since the getters above will throw if values are missing
}