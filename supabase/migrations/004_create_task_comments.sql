-- Create task_comments table for task discussions
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all for task_comments" ON task_comments
    FOR ALL USING (true);
