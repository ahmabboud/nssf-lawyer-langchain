-- Create an admin user with email: admin and password: admin
-- Note: In a production environment, you should use secure credentials

-- This is the proper way to create a user in Supabase
-- that will work with auth.signInWithPassword

-- First, create the user using Supabase's auth.users() function
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create the user with email verification already done
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ahbmailbox@gmail.com',
    crypt('admin', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Set the user's role to admin
  UPDATE auth.users
  SET role = 'admin'
  WHERE id = new_user_id;
  
  -- Insert into auth.identities for the user
  -- Include the provider_id which is required and cannot be null
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id, 'ahbmailbox@gmail.com')::jsonb,
    'email',
    'ahbmailbox@gmail.com', -- provider_id for email provider is typically the email address
    NOW(),
    NOW(),
    NOW()
  );
END $$;