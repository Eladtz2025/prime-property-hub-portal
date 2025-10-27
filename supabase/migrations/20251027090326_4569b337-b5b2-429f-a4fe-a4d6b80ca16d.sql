-- Create table for remote brokerage form tokens
CREATE TABLE IF NOT EXISTS brokerage_form_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  form_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired')),
  client_filled_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE brokerage_form_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tokens
CREATE POLICY "Admins can manage all tokens"
ON brokerage_form_tokens
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Anyone with token can view and update (for signing)
CREATE POLICY "Anyone with token can view"
ON brokerage_form_tokens
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update pending tokens to signed"
ON brokerage_form_tokens
FOR UPDATE
USING (status = 'pending')
WITH CHECK (status IN ('pending', 'signed'));

-- Add index on token for fast lookups
CREATE INDEX idx_brokerage_tokens_token ON brokerage_form_tokens(token);