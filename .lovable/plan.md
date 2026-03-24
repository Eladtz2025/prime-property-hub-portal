

## תיקון תצוגה מקדימה — משיכת תמונות הנכס אוטומטית

### הבעיה
כשבוחרים "אוטומטי — דירות", הפריוויו מציג את הטקסט נכון אבל **בלי תמונות** כי:
1. שאילתת הנכסים (שורה 103) מושכת רק `property_images!inner(id)` — רק ID לצורך סינון, בלי `image_url`
2. בקוד הפריוויו (שורה 692) — `previewImages` נשאר כ-`imageUrls` (ריק), גם כשיש דירה לדוגמה

### התיקון

**`AutoPublishManager.tsx`:**

1. **שינוי השאילתה** (שורה 103): החלפת `property_images!inner(id)` ב-`property_images!inner(id, image_url, is_main, order_index)` — כך נקבל את ה-URLs של התמונות
2. **שינוי לוגיקת הפריוויו** (שורות 690-708): כשיש `sampleProp` במצב recurring, למשוך את התמונות שלו מ-`sampleProp.property_images` ולהעביר אותן ל-`FacebookPostPreview`
3. **גם במצב חד-פעמי**: כשנבחר נכס ספציפי (`selectedPropertyId`), למשוך את תמונות הנכס מה-`properties` array ולהציג אותן בפריוויו

**קובץ אחד, ~10 שורות שינוי.**

