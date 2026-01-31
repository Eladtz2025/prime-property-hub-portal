

# תיקון תמיכת שכונות לכל מקור (Yad2/Madlan/Homeless)

## הבעיה שזוהתה

אתה צודק! יש חוסר התאמה בין שלושת המקומות שמגדירים שכונות:
1. **UI (locations.ts)** - מה שהמשתמש יכול לבחור
2. **Edge Functions (neighborhood-codes.ts)** - הקודים לכל אתר
3. **הממשק עצמו** - לא מציג אילו שכונות באמת נתמכות לכל מקור

### פערים שנמצאו

| שכונה | Yad2 | Madlan | Homeless | UI |
|-------|------|--------|----------|-----|
| יד אליהו | ✅ | ❌ | ✅ | ❌ חסר |
| רמת החייל | ✅ | ✅ | ✅ | ❌ חסר |
| רמת גן/גבעתיים | ❌ | ❌ | ❌ | ✅ קיים |

**משמעות:** אם מישהו יוצר קונפיגורציה של מדל"ן עם "יד אליהו" - המערכת תתעלם מהשכונה הזו כי אין קוד עבורה.

---

## הפתרון המוצע

### שלב 1: עדכון locations.ts - הוספת שכונות חסרות ל-UI

נוסיף את השכונות החסרות לרשימת תל אביב:

```typescript
// Add to NEIGHBORHOODS['תל אביב יפו']:
{ 
  value: 'יד_אליהו', 
  label: 'יד אליהו', 
  aliases: ['yad eliyahu', 'בלומפילד'] 
},
{ 
  value: 'רמת_החייל', 
  label: 'רמת החייל', 
  aliases: ['ramat hachayal', 'רמת החיל'] 
},
```

### שלב 2: הוספת Madlan slug ליד אליהו

```typescript
// Add to madlanNeighborhoodSlugs in neighborhood-codes.ts:
'יד_אליהו': 'יד-אליהו',
'יד אליהו': 'יד-אליהו',
```

### שלב 3: הוספת אינדיקטור בממשק ליצירת קונפיגורציה

כשהמשתמש יוצר קונפיגורציה חדשה ובוחר מקור (Yad2/Madlan/Homeless), נסנן את רשימת השכונות הזמינות **רק לאלו שנתמכות באותו מקור**.

**שינוי ב-UnifiedScoutSettings.tsx:**

```typescript
// Filter neighborhoods based on selected source
const getAvailableNeighborhoods = (source: string, allNeighborhoods: Neighborhood[]) => {
  return allNeighborhoods.filter(n => {
    switch(source) {
      case 'yad2':
        return yad2NeighborhoodCodes[n.value] !== undefined;
      case 'madlan':
        return madlanNeighborhoodSlugs[n.value] !== undefined;
      case 'homeless':
        return homelessAreaCodes[n.value] !== undefined;
      default:
        return true;
    }
  });
};
```

### שלב 4: הוספת tooltip עם מידע על תמיכה

בממשק בחירת השכונות, נציג אייקון קטן שמראה באילו מקורות השכונה נתמכת:

```text
שכונה    | תמיכה
---------|---------
צפון ישן | 🟢 🟢 🟢  (Yad2, Madlan, Homeless)
יד אליהו | 🟢 ⚪ 🟢  (Yad2, -, Homeless)
רמת גן   | ⚪ ⚪ ⚪  (לא נתמך לסינון URL)
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/config/locations.ts` | הוספת יד_אליהו, רמת_החייל |
| `supabase/functions/_shared/neighborhood-codes.ts` | הוספת Madlan slug ליד אליהו |
| `src/components/scout/UnifiedScoutSettings.tsx` | סינון שכונות לפי מקור |
| `src/components/ui/neighborhood-selector.tsx` | (אופציונלי) הוספת tooltip תמיכה |

---

## השפעה

| לפני | אחרי |
|------|------|
| משתמש יכול לבחור שכונה שלא נתמכת | רואים רק שכונות נתמכות לכל מקור |
| אין משוב על מה עובד | אינדיקציה ברורה |
| יד אליהו/רמת החייל לא זמינים ב-UI | זמינים לבחירה |

