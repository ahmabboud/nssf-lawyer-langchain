-- Setup extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if not exists (optional, use if you want to isolate these tables)
-- CREATE SCHEMA IF NOT EXISTS chat;

-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add referenced_documents column to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS referenced_documents BIGINT[] DEFAULT array[]::bigint[];

-- Create function to validate referenced documents
CREATE OR REPLACE FUNCTION validate_referenced_documents()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM unnest(NEW.referenced_documents) AS doc_id
        LEFT JOIN documents ON documents.id = doc_id
        WHERE documents.id IS NULL
        AND doc_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Referenced document does not exist';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validating referenced documents
DROP TRIGGER IF EXISTS validate_referenced_documents_trigger ON chat_messages;
CREATE TRIGGER validate_referenced_documents_trigger
    BEFORE INSERT OR UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION validate_referenced_documents();

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for chat_threads
DROP TRIGGER IF EXISTS update_chat_threads_updated_at ON chat_threads;
CREATE TRIGGER update_chat_threads_updated_at
    BEFORE UPDATE ON chat_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_threads
DROP POLICY IF EXISTS "Users can view their own chat threads" ON chat_threads;
CREATE POLICY "Users can view their own chat threads"
    ON chat_threads
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat threads" ON chat_threads;
CREATE POLICY "Users can insert their own chat threads"
    ON chat_threads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat threads" ON chat_threads;
CREATE POLICY "Users can update their own chat threads"
    ON chat_threads
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat threads" ON chat_threads;
CREATE POLICY "Users can delete their own chat threads"
    ON chat_threads
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages from their threads" ON chat_messages;
CREATE POLICY "Users can view messages from their threads"
    ON chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id
            AND chat_threads.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages to their threads" ON chat_messages;
CREATE POLICY "Users can insert messages to their threads"
    ON chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id
            AND chat_threads.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages from their threads" ON chat_messages;
CREATE POLICY "Users can delete messages from their threads"
    ON chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id
            AND chat_threads.user_id = auth.uid()
        )
    );

-- Add thread context to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES chat_threads(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_threads_is_pinned ON chat_threads(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_referenced_docs ON chat_messages USING GIN (referenced_documents);

-- Update document search to include thread context
CREATE OR REPLACE FUNCTION match_documents_in_thread (
  query_embedding VECTOR(1536),
  thread_id UUID,
  match_count INT DEFAULT NULL,
  filter JSONB DEFAULT '{}'
) 
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE (thread_id IS NULL OR thread_id = $2)
    AND CASE WHEN filter = '{}'::jsonb 
        THEN TRUE 
        ELSE metadata @> filter 
    END
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant access to authenticated users
GRANT ALL ON chat_threads TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add comment documentation
COMMENT ON TABLE chat_threads IS 'Stores user chat conversation threads';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat threads';
COMMENT ON TABLE profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN chat_threads.is_pinned IS 'Whether the thread is pinned by the user';
COMMENT ON COLUMN chat_threads.metadata IS 'Additional configurable metadata for the thread';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional metadata for the message (e.g. token counts, model info)';
COMMENT ON COLUMN chat_messages.tokens_used IS 'Number of tokens used for this message';
COMMENT ON COLUMN chat_messages.referenced_documents IS 'Array of document IDs referenced in this message';
COMMENT ON COLUMN documents.thread_id IS 'Chat thread where this document was first referenced';
COMMENT ON FUNCTION match_documents_in_thread IS 'Search for similar documents with optional thread context';