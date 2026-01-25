-- Add task_type column to priority_tasks table
ALTER TABLE priority_tasks 
ADD COLUMN task_type text NOT NULL DEFAULT 'weekly' 
CHECK (task_type IN ('daily', 'weekly'));