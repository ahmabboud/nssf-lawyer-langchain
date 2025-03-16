-- Create enum for user roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('free', 'pro', 'admin');
  END IF;
END
$$;

-- Add role column to auth.users
ALTER TABLE auth.users 
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'free';

-- Function to update user role (only executable by admins)
CREATE OR REPLACE FUNCTION update_user_role(
  user_id UUID,
  new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update user roles';
  END IF;

  -- Update the user's role
  UPDATE auth.users
  SET role = new_role
  WHERE id = user_id;
END;
$$;

-- Policy to allow users to read their own role - create only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND policyname = 'Users can read own role'
  ) THEN
    CREATE POLICY "Users can read own role"
      ON auth.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Policy to allow admins to read all roles - create only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND policyname = 'Admins can read all roles'
  ) THEN
    CREATE POLICY "Admins can read all roles"
      ON auth.users
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM auth.users
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;
END
$$;

-- Default all new users to 'free' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET role = 'free'
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set default role on new user creation - create only if it doesn't exist
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
END
$$;
