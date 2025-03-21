// Configuration variables
export const config = {
  supabase: {
    // Client-side config 
    client: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    // Server-side config - only access these in server components or API routes
    server: {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey: process.env.SUPABASE_PRIVATE_KEY || '',
    }
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.2"),
  },
  auth: {
    defaultRedirectPath: '/',
    loginPath: '/auth',
    protectedPaths: ['/admin'],
    adminRole: 'admin',
  },
  features: {
    demoMode: process.env.NEXT_PUBLIC_DEMO === "true",
    isDevelopment: process.env.NODE_ENV === "development",
  },
  services: {
    serpApi: process.env.SERPAPI_API_KEY || ''
  }
};

// Type-safe environment variable validation
export function validateConfig() {
  // Only run validation on the server side
  if (typeof window !== 'undefined') {
    return; // Skip validation in browser context
  }
  
  // Validate client-side Supabase config
  if (!config.supabase.client.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!config.supabase.client.anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  
  // Validate server-side Supabase config
  if (!config.supabase.server.url) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!config.supabase.server.serviceKey) {
    throw new Error('SUPABASE_PRIVATE_KEY is required');
  }
  
  // Validate OpenAI config
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
}