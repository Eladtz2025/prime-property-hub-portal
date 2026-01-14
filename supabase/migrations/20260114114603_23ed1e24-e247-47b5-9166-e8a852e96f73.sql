-- Update all contact_leads without an assigned agent to Tali (except אלעד טסט)
-- Tali's user ID: 30300ca7-6c59-41e4-99dd-ef59ea3ea349
-- Exclude אלעד טסט ID: 695c7a97-9902-489c-b485-5157bc4c76af

UPDATE contact_leads 
SET assigned_agent_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349'
WHERE assigned_agent_id IS NULL
AND id != '695c7a97-9902-489c-b485-5157bc4c76af';