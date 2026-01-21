-- Batch 4: Mark 20 properties as processed (some with scrape errors)

-- Properties that couldn't be scraped
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "שגיאת סריקה"}'::jsonb
WHERE id IN (
  'c793f180-20a1-4da5-b76b-a42affd1ba5d',  -- ברוריה 27
  'c736e4e4-5e1e-451f-84b0-acdd19ae6805'   -- וינגייט 12
);

-- Properties successfully scraped - mark as processed (no specific entry date found in Madlan listings)
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין במודעה"}'::jsonb
WHERE id IN (
  'b989afa4-f19c-4400-b77c-4e14d335d5e9',  -- דה וינצ'י 8
  '49011635-3f8b-4a4b-932e-270d36783115',  -- מעפילי סלואדור 7
  '8b071ba5-4369-4a87-bf8c-22d11a8d4dfe',  -- אשרמן
  'b1d1cf84-2daf-4114-9a6a-81df83dcb36d',  -- פרופסור שור
  '6be000e8-c023-4617-aa0a-52c1e7cdb288',  -- מודיליאני
  '5bb1f61e-a8b7-4e61-a308-f44df5a63c3a',  -- הנביאים 12
  'ea8b9159-f2a1-49bf-b388-0137d7c57f56',  -- מנורה 2
  'a79e6095-0c44-4fac-99ca-908d2a995b94',  -- בארט 24
  '552b2966-56e5-4c0d-989d-3e442b3bb225',  -- וינגייט 14
  'fa1d4fd0-e4ec-4ce1-8fea-bd7016b2f472',  -- וינגייט 5
  'b80dd6ab-4d24-415b-8887-078cc571173a',  -- אבן גבירול 155
  '81779c17-89e0-4d19-ac04-a88251868d59',  -- רציף העליה השניה 9
  'e185247b-533b-492b-9b5d-28dc47b7ec92',  -- חובבי ציון 34
  '8b0d299e-2ad3-4457-a494-e5110086bfd8',  -- אלנבי 54
  '70eb1c2a-8870-4246-b351-908c976c9310',  -- אלנבי 51
  'bbeb4c22-27fb-4494-8636-69e3816460a3',  -- אבן גבירול 71
  'cccd20f4-3a98-49bd-b711-5b4122d6ab91',  -- קהילת פאדובה 40
  '90eabb33-f64f-47b6-9b6d-b7fdd614ce3a'   -- אבן גבירול
);