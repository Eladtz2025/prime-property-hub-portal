

## תיקון סינון נכסים — רק נכסים פנויים (vacant)

### הבעיה
השאילתה מסננת לפי `available = true`, אבל שדה זה הוא `true` גם לנכסים מושכרים (occupied). בפועל:
- השכרה: 2 פנויים + 6 מושכרים (כולם `available=true`) → מציג 8 במקום 2
- מכירה: 7 פנויים → תקין

נכס "אקטואלי" לפרסום = `status = 'vacant'` (פנוי), לא סתם `available`.

### התיקון

**`AutoPublishManager.tsx` שורה 100:**
```
.eq('available', true)        // ← להסיר
.eq('show_on_website', true)
```
להחליף ב:
```
.eq('show_on_website', true)
.eq('status', 'vacant')
```

**`useAutoPublish.ts` — `useWebsiteProperties`:**
אותו שינוי — החלפת `available = true` ב-`status = 'vacant'`.

**2 קבצים, שינוי שורה אחת בכל אחד.**

