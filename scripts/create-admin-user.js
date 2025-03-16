// This script creates an admin user using the Supabase Admin API
// Run with: node create-admin-user.js
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and service role key (not the anon key)
// You can find these in your Supabase dashboard under Project Settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This is the service role key, not the anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const adminEmail = 'ahbmailbox@gmail.com';
  const adminPassword = 'admin';

  console.log(`Creating admin user with email: ${adminEmail}`);

  // 1. Create the user through auth API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true, // Auto-confirm the email
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('User created successfully with ID:', authData.user.id);

  // 2. Set the user's role to admin
  const { error: updateError } = await supabase.rpc('update_user_role', {
    user_id: authData.user.id,
    new_role: 'admin'
  });

  if (updateError) {
    console.error('Error setting user role:', updateError);
    return;
  }

  console.log('User role set to admin successfully');
}

createAdminUser()
  .catch(console.error)
  .finally(() => process.exit(0));