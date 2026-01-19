-- Create priority_tasks table
CREATE TABLE public.priority_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.priority_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage all priority tasks" 
ON public.priority_tasks 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));

-- Create policy for users to view their own tasks
CREATE POLICY "Users can view their own tasks" 
ON public.priority_tasks 
FOR SELECT 
USING (auth.uid() = created_by);

-- Create policy for users to create their own tasks
CREATE POLICY "Users can create their own tasks" 
ON public.priority_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Create policy for users to update their own tasks
CREATE POLICY "Users can update their own tasks" 
ON public.priority_tasks 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create policy for users to delete their own tasks
CREATE POLICY "Users can delete their own tasks" 
ON public.priority_tasks 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create index for faster queries
CREATE INDEX idx_priority_tasks_priority ON public.priority_tasks(priority);
CREATE INDEX idx_priority_tasks_created_by ON public.priority_tasks(created_by);
CREATE INDEX idx_priority_tasks_is_completed ON public.priority_tasks(is_completed);