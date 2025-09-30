-- Add owner information columns to properties table
ALTER TABLE public.properties 
ADD COLUMN owner_name TEXT,
ADD COLUMN owner_phone TEXT;