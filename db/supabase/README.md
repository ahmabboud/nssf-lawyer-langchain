# Supabase Vector Store Setup

This directory contains SQL scripts to set up your Supabase database for vector search functionality used by the application's retrieval features.

## Setup Instructions

1. Log in to your Supabase dashboard and open the SQL Editor
2. Run the scripts in numerical order:
   - First run `01_setup_vector_extension.sql` to enable the pgvector extension
   - Then run `02_create_documents_table.sql` to create the necessary table and functions

## What These Scripts Do

- `01_setup_vector_extension.sql`: Enables the pgvector extension which allows the database to store and query vector embeddings
- `02_create_documents_table.sql`: Creates the `documents` table with a vector column and the `match_documents` function used for similarity search

## Environment Variables

After setting up the database, make sure to add these environment variables to your `.env.local` file:

```
SUPABASE_URL="your_supabase_url"
SUPABASE_PRIVATE_KEY="your_supabase_service_role_key"
```

You can find these values in your Supabase dashboard under Project Settings > API.

## Troubleshooting

If you get the error "Could not find the function public.match_documents", make sure:
1. You've run both SQL scripts successfully
2. You're using the service role key (not the anon key) as your SUPABASE_PRIVATE_KEY
3. The table and function names match what's expected in the application code