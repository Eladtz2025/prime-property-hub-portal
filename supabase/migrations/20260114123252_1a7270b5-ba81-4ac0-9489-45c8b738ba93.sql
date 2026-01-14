-- Fix Roni's outdoor_space_any to true (OR mode for balcony/yard/roof)
UPDATE contact_leads 
SET outdoor_space_any = true 
WHERE id = '6b95f5af-fa94-47a2-87f7-e0c17934b91b';