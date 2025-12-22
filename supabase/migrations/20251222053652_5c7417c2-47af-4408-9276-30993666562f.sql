-- Create monitoring_logs table for system monitoring
CREATE TABLE public.monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('up', 'down', 'slow')),
  response_time_ms INTEGER,
  error_message TEXT,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create error_logs table for error tracking
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_agent TEXT,
  page_url TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create backup_history table for backup tracking
CREATE TABLE public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_name TEXT NOT NULL,
  file_size_kb INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  tables_backed_up JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for monitoring_logs - only admins can access
CREATE POLICY "Admins can view monitoring_logs" ON public.monitoring_logs
  FOR SELECT USING (get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can insert monitoring_logs" ON public.monitoring_logs
  FOR INSERT WITH CHECK (get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "System can insert monitoring_logs" ON public.monitoring_logs
  FOR INSERT WITH CHECK (true);

-- RLS policies for error_logs - only admins can access
CREATE POLICY "Admins can view error_logs" ON public.error_logs
  FOR SELECT USING (get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Anyone can insert error_logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update error_logs" ON public.error_logs
  FOR UPDATE USING (get_current_user_role() IN ('admin', 'super_admin'));

-- RLS policies for backup_history - only admins can access
CREATE POLICY "Admins can view backup_history" ON public.backup_history
  FOR SELECT USING (get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can insert backup_history" ON public.backup_history
  FOR INSERT WITH CHECK (get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "System can insert backup_history" ON public.backup_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update backup_history" ON public.backup_history
  FOR UPDATE USING (get_current_user_role() IN ('admin', 'super_admin'));

-- Create storage bucket for database backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('database-backups', 'database-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for database-backups bucket
CREATE POLICY "Admins can view backups" ON storage.objects
  FOR SELECT USING (bucket_id = 'database-backups' AND get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can upload backups" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'database-backups' AND get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can delete backups" ON storage.objects
  FOR DELETE USING (bucket_id = 'database-backups' AND get_current_user_role() IN ('admin', 'super_admin'));

-- Add indexes for performance
CREATE INDEX idx_monitoring_logs_check_time ON public.monitoring_logs(check_time DESC);
CREATE INDEX idx_error_logs_error_time ON public.error_logs(error_time DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_backup_history_backup_date ON public.backup_history(backup_date DESC);