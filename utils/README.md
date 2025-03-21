# Utils and Configuration Management

This directory contains utility functions and configuration management for the NSSF Lawyer LangChain application.

## Environment Variables Management

The application uses a centralized configuration system through the `config.ts` file to handle environment variables. This approach provides several benefits:

- **Type safety** for all configuration values
- **Consistent error handling** across the application
- **Separation between client and server configurations**
- **Centralized validation** of required variables

### Key Configuration Files

- **`config.ts`**: Central configuration store that loads and validates environment variables
- **`supabaseClient.ts`**: Client-side Supabase client creation
- **`serverSupabaseClient.ts`**: Server-side Supabase client creation with appropriate safeguards
- **`apiMiddleware.ts`**: API route protection with configuration validation

### Current Environment Variables Structure

The configuration is organized into these sections:

```typescript
export const config = {
  supabase: {
    // Client-side config 
    client: { /* CLIENT VARS */ },
    // Server-side config
    server: { /* SERVER VARS */ }
  },
  openai: { /* OPENAI VARS */ },
  auth: { /* AUTH SETTINGS */ },
  features: { /* FEATURE FLAGS */ },
  services: { /* THIRD-PARTY SERVICES */ }
};
```

### How To Add New Environment Variables

When adding a new environment variable, follow these steps:

1. **Add to the appropriate section in `config.ts`**:
   ```typescript
   // For example, adding a new API key for a service:
   services: {
     // Existing services
     serpApi: process.env.SERPAPI_API_KEY || '',
     // New service
     newService: process.env.NEW_SERVICE_API_KEY || '',
   }
   ```

2. **Update the validation function** in `config.ts` if the variable is required:
   ```typescript
   export function validateConfig() {
     // Existing validation
     
     // Add validation for new required variables
     if (!config.services.newService && isCriticalFeatureEnabled) {
       throw new Error('NEW_SERVICE_API_KEY is required when critical feature is enabled');
     }
   }
   ```

3. **Use the config value in your code** instead of accessing `process.env` directly:
   ```typescript
   import { config } from '@/utils/config';
   
   // Instead of this:
   // const apiKey = process.env.NEW_SERVICE_API_KEY;
   
   // Use this:
   const apiKey = config.services.newService;
   ```

### Client vs Server Variables

- **Client-side variables** must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- **Server-side variables** should never be prefixed with `NEXT_PUBLIC_` to keep them secure
- Use the appropriate section in the config file:
  - Client-side code should only access `config.supabase.client` and other public config
  - Server-side code can access all config including `config.supabase.server`

### Environment Files

The application uses `.env.local` for local environment variables. Example structure:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PRIVATE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2

# Feature Flags
NEXT_PUBLIC_DEMO=false

# Additional Services
SERPAPI_API_KEY=your-serpapi-key
```

## Utility Functions

Other utilities in this directory:

- **`cn.ts`**: Utility for Tailwind CSS class name merging
- **`apiMiddleware.ts`**: Error handling and authentication for API routes
- **`userManagement.ts`**: User role management functions

## Best Practices

1. **Never access `process.env` directly** in application code
2. **Always use the config object** for environment variables
3. **Keep validation logic** in the `validateConfig()` function
4. **Create helper functions** for complex configuration needs
5. **Use appropriate error handling** when configuration might be missing