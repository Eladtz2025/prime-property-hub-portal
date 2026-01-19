
-- Insert differentiators slide into all 4 existing pitch decks
-- Using slide_order 9 (before contact which is typically 10)

INSERT INTO pitch_deck_slides (deck_id, slide_type, slide_order, is_visible, slide_data)
VALUES 
  -- Ben Yehuda 110 (original)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'differentiators', 9, true, 
   '{"title": "What Differentiates City Market", "differentiators": [
     {"heading": "Designed for an international audience", "description": "Specialized expertise catering to foreign buyers, relocation clients, and international investors", "icon": "Globe"},
     {"heading": "Native English-speaking representation", "description": "Clear, confident communication that builds trust and removes friction at every stage of the process", "icon": "MessageCircle"},
     {"heading": "End-to-end guidance", "description": "Comprehensive support through a trusted network of legal, tax, and transaction specialists—from initial interest through closing", "icon": "Handshake"},
     {"heading": "Global reach with local depth", "description": "Direct access to personal and professional networks both locally and internationally, connecting properties with a diverse, qualified client base—investors, end users, and relocating families", "icon": "Network"}
   ]}'::jsonb),
  
  -- יצחק אלחנן 14
  ('560d35aa-7fe8-4c61-a6cf-b16cd359cdbf', 'differentiators', 9, true,
   '{"title": "What Differentiates City Market", "differentiators": [
     {"heading": "Designed for an international audience", "description": "Specialized expertise catering to foreign buyers, relocation clients, and international investors", "icon": "Globe"},
     {"heading": "Native English-speaking representation", "description": "Clear, confident communication that builds trust and removes friction at every stage of the process", "icon": "MessageCircle"},
     {"heading": "End-to-end guidance", "description": "Comprehensive support through a trusted network of legal, tax, and transaction specialists—from initial interest through closing", "icon": "Handshake"},
     {"heading": "Global reach with local depth", "description": "Direct access to personal and professional networks both locally and internationally, connecting properties with a diverse, qualified client base—investors, end users, and relocating families", "icon": "Network"}
   ]}'::jsonb),
  
  -- זלטופולסקי 19
  ('d218891c-c4d7-4661-8e3a-59cf70e0863a', 'differentiators', 9, true,
   '{"title": "What Differentiates City Market", "differentiators": [
     {"heading": "Designed for an international audience", "description": "Specialized expertise catering to foreign buyers, relocation clients, and international investors", "icon": "Globe"},
     {"heading": "Native English-speaking representation", "description": "Clear, confident communication that builds trust and removes friction at every stage of the process", "icon": "MessageCircle"},
     {"heading": "End-to-end guidance", "description": "Comprehensive support through a trusted network of legal, tax, and transaction specialists—from initial interest through closing", "icon": "Handshake"},
     {"heading": "Global reach with local depth", "description": "Direct access to personal and professional networks both locally and internationally, connecting properties with a diverse, qualified client base—investors, end users, and relocating families", "icon": "Network"}
   ]}'::jsonb),
  
  -- Ben Yehuda 110 New
  ('a4921ef4-198f-4f8a-a3f7-9c0e793de07c', 'differentiators', 9, true,
   '{"title": "What Differentiates City Market", "differentiators": [
     {"heading": "Designed for an international audience", "description": "Specialized expertise catering to foreign buyers, relocation clients, and international investors", "icon": "Globe"},
     {"heading": "Native English-speaking representation", "description": "Clear, confident communication that builds trust and removes friction at every stage of the process", "icon": "MessageCircle"},
     {"heading": "End-to-end guidance", "description": "Comprehensive support through a trusted network of legal, tax, and transaction specialists—from initial interest through closing", "icon": "Handshake"},
     {"heading": "Global reach with local depth", "description": "Direct access to personal and professional networks both locally and internationally, connecting properties with a diverse, qualified client base—investors, end users, and relocating families", "icon": "Network"}
   ]}'::jsonb);

-- Update slide_order for slides that were at position 9+ to shift them up
UPDATE pitch_deck_slides 
SET slide_order = slide_order + 1
WHERE deck_id IN (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '560d35aa-7fe8-4c61-a6cf-b16cd359cdbf',
  'd218891c-c4d7-4661-8e3a-59cf70e0863a',
  'a4921ef4-198f-4f8a-a3f7-9c0e793de07c'
)
AND slide_order >= 9
AND slide_type != 'differentiators';
