-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Optional: Update the extension if it already exists but needs to be updated
-- ALTER EXTENSION vector UPDATE;

-- You can confirm the extension is installed by running:
-- \dx
-- This should list "vector" among the installed extensions