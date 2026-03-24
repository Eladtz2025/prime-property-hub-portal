

## שדרוג האשטגים — קבוצות בעברית ואנגלית + ניהול מותאם אישית

### קבוצות ברירת מחדל (5 קבוצות × 2 שפות = 10 chips)

**עברית:**
| קבוצה | האשטגים |
|-------|---------|
| 🏠 השכרה ת"א | `#נדלן #דירהלהשכרה #להשכרה #שכירות #תלאביב` |
| 💰 מכירה ת"א | `#נדלן #דירהלמכירה #למכירה #תלאביב #רכישתדירה` |
| 📈 השקעות | `#נדלן #תלאביב #השקעותנדלן #תשואה #משקיעים` |
| ✨ יוקרה | `#נדלן #תלאביב #יוקרה #פנטהאוז #עיצובפנים` |
| 💡 טיפים | `#נדלן #תלאביב #טיפינדלן #מדריךרכישה #שוקהדיור` |

**אנגלית:**
| Group | Hashtags |
|-------|---------|
| 🏠 Rent TLV | `#realestate #telaviv #forrent #rental #apartment` |
| 💰 Sale TLV | `#realestate #telaviv #forsale #property #homeforsale` |
| 📈 Investment | `#realestate #telaviv #realestateinvesting #ROI #investment` |
| ✨ Luxury | `#realestate #telaviv #luxury #penthouse #interiordesign` |
| 💡 Tips | `#realestate #telaviv #realestatetips #homebuying #propertymarket` |

### אפשרות ניהול — הוספה, עריכה, מחיקה של קבוצות

הקבוצות ישמרו ב-**localStorage** (לא DB — פשוט ומהיר). כפתור קטן "ניהול קבוצות" יפתח dialog שבו אפשר:
- לערוך שם קבוצה וההאשטגים שלה
- להוסיף קבוצה חדשה
- למחוק קבוצה (לא את ברירות המחדל)
- כפתור "איפוס לברירת מחדל"

### שינויים טכניים

| קובץ | שינוי |
|-------|-------|
| חדש: `HashtagGroupSelector.tsx` | קומפוננטה — chips לבחירת קבוצות, badges להאשטגים שנבחרו, input להוספה ידנית, כפתור "ניהול" |
| חדש: `HashtagGroupsEditor.tsx` | Dialog לניהול קבוצות — הוספה/עריכה/מחיקה, שמירה ב-localStorage |
| `SocialPostComposer.tsx` | החלפת Input hashtags (שורות 312-321) ב-`<HashtagGroupSelector />` |
| `SocialTemplatesManager.tsx` | אותו שינוי בדיאלוג עריכת תבנית |

**4 קבצים, ~150 שורות חדשות.**

