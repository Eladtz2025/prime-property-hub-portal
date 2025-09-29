-- Add new columns to whatsapp_messages table to support both API formats and group messages
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS group_name text,
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS api_source text DEFAULT 'meta',
ADD COLUMN IF NOT EXISTS chat_id text,
ADD COLUMN IF NOT EXISTS sender_id text;

-- Add index for better performance on chat queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_type ON whatsapp_messages(chat_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_api_source ON whatsapp_messages(api_source);