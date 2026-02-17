-- Fix corrupted prices from last 90 minutes where room count digits got concatenated into price
-- Pattern: extractPrice stripped spaces causing "3,980,000₪ 3 חד'" → 39800003
-- Fix: divide by 10 and floor to remove the trailing room digit

UPDATE scouted_properties
SET price = floor(price / 10)
WHERE id IN (
  '20a9ccb1-96be-428f-8e54-9b3f7376db8b',  -- 39800003 → 3980000
  '4c0e64a1-8fe5-4efb-8f0d-7c7057a04464',  -- 29500003 → 2950000
  '5e3ec59b-dd92-4768-b14c-65d4a67b3d37',  -- 52000003 → 5200000
  'ca279910-af71-46ac-a742-c400c3785de7',  -- 135004 → 13500
  'd306cbbe-d5e8-4f50-9140-5df1f85b8a92',  -- 100012 → 10001
  '97829fa9-a85a-454d-b5a2-3ff21f4c29d4',  -- 36000003 → 3600000
  '27bf568c-2651-4b51-ad3d-cafd9a93a4f0',  -- 39000003 → 3900000
  '967fff55-dab4-41b2-9f5b-640b4c4f68f9',  -- 27900003 → 2790000
  '3e3f8df4-0a19-46ef-9919-07bfd404f378',  -- 36500003 → 3650000
  '479fe8b2-0a24-467c-a498-0dd1815b2b25'   -- 28500003 → 2850000
);