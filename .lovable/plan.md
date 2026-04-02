

## בחירת תמונות לפוסט פייסבוק — תמונה ראשית + מולטי-תמונות

### מצב נוכחי
כשבוחרים נכס, הפוסט מציג **Link Card** (פייסבוק שולף OG מהאתר) עם התמונה הראשית בלבד. אין אפשרות לבחור תמונה אחרת או להציג כמה תמונות.

### מה ישתנה

**1. בורר תמונות מהנכס:**
כשבוחרים נכס — מוצגת רשימת thumbnails של כל תמונות הנכס (מתוך `property_images`). לחיצה על תמונה בוחרת אותה כראשית.

**2. מצב פרסום — Link Card או Photo Post:**
toggle חדש מאפשר לבחור:
- **Link Card** (ברירת מחדל) — תמונה אחת + קישור לאתר. פייסבוק בונה OG card
- **Photo Post** — תמונות מרובות בלי Link Card. המשתמש מסמן אילו תמונות לכלול (checkbox על כל thumbnail)

### שינויים

| # | קובץ | שינוי |
|---|-------|--------|
| 1 | `src/components/social/AutoPublishManager.tsx` | הוסף state: `postStyle` (link/photos), `selectedImageIndex`, `selectedImageUrls[]`. הצג gallery thumbnails מתמונות הנכס כשנבחר נכס. ב-link mode — בחירת תמונה ראשית. ב-photos mode — multi-select. עדכן `executeSave` לשלוח `image_urls` כשב-photo mode |
| 2 | `src/components/social/FacebookPostPreview.tsx` | ה-preview כבר תומך בשני המצבים (linkCard או imageUrls grid) — אין שינוי |
| 3 | `supabase/functions/social-publish/index.ts` | כבר תומך בשני הנתיבים (link post vs photo post) — אין שינוי |

**קובץ אחד לעריכה בלבד. ה-preview וה-edge function כבר מוכנים.**

### UX

```text
┌─────────────────────────────┐
│ סוג פרסום:                  │
│ [◉ Link Card] [○ תמונות]   │
│                             │
│ בחר תמונות:                 │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│ │ ✓  │ │    │ │    │ │    ││
│ │img1│ │img2│ │img3│ │img4││
│ └────┘ └────┘ └────┘ └────┘│
│                             │
│ במצב Link Card — בחירה     │
│ יחידה (תמונה ראשית)        │
│ במצב תמונות — multi-select │
└─────────────────────────────┘
```

