-- Step 1: Delete 12 empty "רחוב" properties
DELETE FROM properties 
WHERE address = 'רחוב' 
  AND owner_name = 'שם בעל דירה'
  AND monthly_rent IS NULL;

-- Step 2: Delete 22 duplicate properties (keeping the one with most data)
DELETE FROM properties 
WHERE id IN (
  -- דיזנגוף 173 (3 duplicates)
  '33d6694c-3513-438a-b798-c09e6bc249d7',
  '44f33d7d-e150-463c-8f85-e6a005f8d476',
  'e6d4f74d-bf04-4f00-a384-f3cd014200d1',
  -- נורדאו (2 duplicates)
  'c0b411c9-2182-42ad-9841-d529fa4e9f15',
  'd064591d-a6d3-4d20-956d-00753b4fe9bb',
  -- הירקון 313 (2 duplicates)
  'fb3c317f-d6d5-437f-a2d6-44d51626d1b1',
  'b50c091a-ec0a-4312-a309-9617b3eb2e8c',
  -- בן יהודה 200 (1 duplicate)
  '389cb075-e037-4201-97b3-239070bf2204',
  -- בן יהודה 248 (1 duplicate)
  '1c220c37-5eb4-4178-bb08-d9b8cdeffab6',
  -- ברנר 8 (1 duplicate)
  '8f4d9818-0b93-4b45-853b-fb352fb0f2d2',
  -- הורקנוס 1 (1 duplicate)
  'e85de75f-026a-41c1-b651-1a42e2414a21',
  -- הירקון 282 (1 duplicate)
  '2fafc6bc-0288-4267-8551-069e68533264',
  -- זלטופולסקי 19 (1 duplicate)
  'd8cf5f53-623f-47f1-9163-68fd84470b1d',
  -- נורדאו 47 (1 duplicate)
  '62773bf8-e7c4-42db-aade-e7441dd3270f',
  -- צידון 14 (1 duplicate)
  'd51cd963-305a-4e3a-a877-2516abf89038',
  -- רמב"ם 5 (1 duplicate)
  '7ef7ab99-e0ea-48ba-8b81-dfa3580c9d51',
  -- אוסישקין 62 (1 duplicate)
  '2e418898-c245-4f78-81c2-a6f6c1accabd',
  -- שדרות היוצר 5 (1 duplicate)
  'f75afe53-e0e8-40fd-b5fe-6e5ee5cbd226',
  -- אוסישקין 96 (1 duplicate)
  'ba298fb5-3cbf-4c6b-be90-1d9525b70a90',
  -- בן יהודה 139 (1 duplicate)
  'a97ef159-69ed-479f-bdbc-1f5e1d891c20'
);