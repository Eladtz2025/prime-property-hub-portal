
המשתמש מדווח שכפתור ההפעלה בכרטיסית "השלמת נתונים" בעמוד סקאוט נדל"ן לא עובד. מה-session replay אני רואה:

1. המשתמש לחץ על הכפתור (id 4242)
2. הסטטוס השתנה ל"פעיל" עם "1605/1650"
3. הופיעה הודעה "מתחיל השלמת נתונים (Jina)..."
4. **מיד אחרי** הסטטוס חזר ל"ממתין" והופיעה הודעה "השלמת נתונים (Jina) נעצרה"

זה אומר שהמשימה נעצרת מיד אחרי שהיא מתחילה. צריך לבדוק:
- את הקומפוננטה של הכרטיסיה
- את ה-Edge Function של ה-backfill
- את ה-Kill Switch / feature flags (יש memory על זה)
- את ה-backfill trigger policy (יש memory: רץ רק 00:00-02:30, אבל manual runs אמורים לעקוף)

לפי ה-memories:
- `backfill-trigger-policy`: backfill רץ רק 00:00-02:30, אבל manual runs עם `manual: true` אמורים לעקוף
- `manual-run-management`: manual runs מהUI עוקפים את ההגבלות
- `process-control-kill-switches`: יש kill switches ב-feature_flags

החשד שלי: או שה-kill switch מופעל, או שה-manual flag לא מועבר נכון, או שיש בדיקת זמן שלא מכבדת את ה-manual flag.

אני צריך לבדוק את הקוד לפני שאני מציע תוכנית.
