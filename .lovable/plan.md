

## שדרוג עמוד Insights לרמה פרימיום — עיצוב מחדש

### הבעיות הנוכחיות
1. **אין אנימציות כניסה** — כל הסקשנים מופיעים בבת אחת, בניגוד לעמוד About שמשתמש ב-`ScrollAnimated`
2. **כרטיסי כתבות שטוחים** — `bg-card/50 border border-border/30` נראה זול. חסר עומק, hover מרשים, ומעבר צבע עדין
3. **Empty state בסיסי מדי** — שורה אחת של טקסט במקום אלמנט ויזואלי מזמין
4. **סקשן בעלי מקצוע (CTA)** — גרדיאנט `from-foreground to-primary` כבד מדי, לא תואם לשפה העיצובית של שאר האתר
5. **חסר מבנה ויזואלי** — אין שימוש ב-`max-w-6xl`, אין ריווח פרופורציונלי, אין מפרידים דקורטיביים

### שינויים

**`src/pages/he/Insights.tsx` + `src/pages/en/Insights.tsx`:**

1. **הוספת ScrollAnimated** לכל סקשן — אנימציות כניסה בגלילה כמו בעמוד About
2. **שדרוג InsightCard** — עיצוב פרימיום:
   - הסרת border, הוספת `shadow-md hover:shadow-2xl`
   - Overlay gradient עדין על התמונה
   - קו תחתון דקורטיבי (gold line) שמתרחב ב-hover
   - Padding גדול יותר, ריווח בין אלמנטים
   - Aspect ratio `3:4` (כמו division cards) במקום `16:10`
3. **שדרוג empty state** — אלמנט ויזואלי עם קו דקורטיבי, אייקון עדין, וטקסט Playfair מזמין
4. **שדרוג סקשן CTA בעלי מקצוע** — החלפת הגרדיאנט הכבד ב-`bg-gradient-to-br from-primary/10 via-primary/5 to-background` (כמו CTA בעמוד About), כפתור מותאם
5. **ריווח ומבנה** — `max-w-6xl mx-auto` לגריד, padding מתאים למובייל (`py-12 md:py-16 lg:py-24`)
6. **גריד רספונסיבי** — כשיש כתבה אחת בלבד, היא תוצג ברוחב מלא / 2 עמודות במקום כרטיס קטן בצד

### פרטים טכניים
- Import של `ScrollAnimated` מ-`@/components/about/ScrollAnimated`
- InsightCard ישאר inline component בכל קובץ (לא קובץ נפרד)
- אפס שינויים בלוגיקה, DB, או ניתוב
- **2 קבצים לעריכה** (HE + EN)

