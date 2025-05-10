# Supabase Vector Store Setup

This directory contains SQL scripts to set up your Supabase database for vector search functionality, user role management, and chat thread storage.

## Setup Instructions

1. Log in to your Supabase dashboard and open the SQL Editor
2. Run the scripts in numerical order:
   - First run `01_setup_vector_extension.sql` to enable the pgvector extension
   - Then run `02_create_documents_table.sql` to create the necessary table and functions
   - Then run `03_setup_user_roles.sql` to set up user role management
   - Finally run `05_create_chat_threads.sql` to set up chat thread storage

## What These Scripts Do

- `01_setup_vector_extension.sql`: Enables the pgvector extension which allows the database to store and query vector embeddings
- `02_create_documents_table.sql`: Creates the `documents` table with a vector column and the `match_documents` function used for similarity search
- `03_setup_user_roles.sql`: Sets up user role management with three tiers (free, pro, admin) and necessary security policies
- `05_create_chat_threads.sql`: Sets up tables and policies for storing chat conversations and messages

## Environment Variables

After setting up the database, make sure to add these environment variables to your `.env.local` file:

```
SUPABASE_URL="your_supabase_url"
SUPABASE_PRIVATE_KEY="your_supabase_service_role_key"
```

You can find these values in your Supabase dashboard under Project Settings > API.

## User Roles

The system supports three user roles:
- `free`: Default role for new users
- `pro`: Premium tier users
- `admin`: Administrative users with full access

Only admin users can change user roles using the `update_user_role` function.

## Chat Threads Schema

The chat system uses two main tables:

### chat_threads
- `id`: UUID (Primary Key)
- `user_id`: UUID (References auth.users)
- `title`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### chat_messages
- `id`: UUID (Primary Key)
- `thread_id`: UUID (References chat_threads)
- `role`: Text ('user', 'assistant', or 'system')
- `content`: Text
- `created_at`: Timestamp

Row Level Security (RLS) policies ensure users can only access their own chat threads and messages.

## Troubleshooting

If you get the error "Could not find the function public.match_documents", make sure:
1. You've run both SQL scripts successfully
2. You're using the service role key (not the anon key) as your SUPABASE_PRIVATE_KEY
3. The table and function names match what's expected in the application code