-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'auth'
    AND tablename = 'users'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure auth.users has the policy for reading own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND policyname = 'User can read own data'
  ) THEN
    CREATE POLICY "User can read own data"
      ON auth.users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Policy to allow admins to read all users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND policyname = 'Admins can read all users'
  ) THEN
    CREATE POLICY "Admins can read all users"
      ON auth.users
      FOR SELECT
      TO authenticated
      USING (
        (auth.jwt() ->> 'role')::text = 'admin' OR
        EXISTS (
          SELECT 1
          FROM auth.users u
          WHERE u.id = auth.uid()
          AND (u.raw_app_meta_data->>'role')::text = 'admin'
        )
      );
  END IF;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Drop and recreate user_roles table to ensure one role per user
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default roles if they don't exist
INSERT INTO public.roles (name) VALUES
    ('admin'),
    ('pro'),
    ('free')
ON CONFLICT (name) DO NOTHING;

-- Drop the view if it exists before creating it
DROP VIEW IF EXISTS public.user_management_view;

-- Create the user management view with COALESCE for default role
CREATE VIEW public.user_management_view AS
WITH default_role AS (
    SELECT id AS role_id 
    FROM public.roles 
    WHERE name = 'free'
)
SELECT 
    u.id,
    u.email,
    u.created_at,
    COALESCE(r.name, 'free') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id;

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop ALL existing functions with all possible signatures
DO $$ 
DECLARE
    func_name text;
    func_args text;
BEGIN
    -- Drop all versions of update_user_role
    FOR func_name, func_args IN 
        SELECT p.proname, pg_get_function_arguments(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_user_role'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_name, func_args);
    END LOOP;
    
    -- Drop other functions
    DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from functions that don't exist
    NULL;
END $$;

-- Create a single, unambiguous version of update_user_role
CREATE FUNCTION update_user_role(
    user_id UUID,
    new_role VARCHAR(50)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id INTEGER;
BEGIN
    -- Check if the current user is an admin using a direct query with no recursion
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can update user roles';
    END IF;

    -- Get the role id using explicit type casting
    SELECT id INTO role_id
    FROM public.roles
    WHERE name = new_role;

    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Invalid role name';
    END IF;

    -- Upsert the role (insert or update) - fixed syntax by removing table alias
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (update_user_role.user_id, role_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        created_at = NOW();
END;
$$;

-- Function to get user's role
CREATE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    SELECT r.name INTO user_role
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid;
    
    RETURN COALESCE(user_role, 'free');
END;
$$;

-- Function to ensure new users get the free role
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    free_role_id INTEGER;
BEGIN
    -- Get the free role id
    SELECT id INTO free_role_id
    FROM public.roles
    WHERE name = 'free';

    -- Insert free role for new user if they don't have a role yet
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, free_role_id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Remove all existing policies from the tables
DO $$
DECLARE
  r record; -- Properly declare r as a record type
BEGIN
  -- Drop policies from roles table if they exist
  DROP POLICY IF EXISTS "Roles are viewable by all authenticated users" ON public.roles;
  
  -- Drop policies from user_roles table if they exist
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can modify all user_roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can modify all roles" ON public.user_roles;
  
  -- Try to drop any other policies that might exist by name pattern
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('roles', 'user_roles')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Set up RLS policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a permanent admin lookup table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Populate admin lookup table
TRUNCATE public.admin_users;
INSERT INTO public.admin_users (user_id)
SELECT ur.user_id
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'admin';

-- Simple policy for roles table
CREATE POLICY "Roles are viewable by everyone"
  ON public.roles
  FOR SELECT
  USING (true);

-- Policies for user_roles table
-- 1. Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. Admins can view all user roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- 3. Admins can insert/update/delete roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Clean up duplicate roles and ensure one role per user
DO $$
DECLARE
    free_role_id INTEGER;
BEGIN
    -- Get the free role id
    SELECT id INTO free_role_id
    FROM public.roles
    WHERE name = 'free';

    -- Remove duplicates keeping the most recent role for each user
    WITH ranked_roles AS (
        SELECT user_id,
               role_id,
               created_at,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.user_roles
    )
    DELETE FROM public.user_roles
    WHERE (user_id, created_at) IN (
        SELECT user_id, created_at
        FROM ranked_roles
        WHERE rn > 1
    );

    -- Add free role for any users without a role
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT u.id, free_role_id
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE ur.user_id IS NULL;
END;
$$;
