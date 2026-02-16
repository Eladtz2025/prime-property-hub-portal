-- Insert process kill-switch flags into feature_flags
INSERT INTO public.feature_flags (name, description, is_enabled, created_at, updated_at)
VALUES
  ('process_scans', 'מתג הפעלה/כיבוי לסריקות נכסים', true, now(), now()),
  ('process_availability', 'מתג הפעלה/כיבוי לבדיקת זמינות', true, now(), now()),
  ('process_duplicates', 'מתג הפעלה/כיבוי לזיהוי כפילויות', true, now(), now()),
  ('process_matching', 'מתג הפעלה/כיבוי להתאמות לקוחות', true, now(), now()),
  ('process_backfill', 'מתג הפעלה/כיבוי להשלמת נתונים', true, now(), now())
ON CONFLICT DO NOTHING;