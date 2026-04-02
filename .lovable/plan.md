

## תיקון שגיאה: עמודת `link_url` חסרה בטבלת `social_posts`

### הבעיה
הצילום מסך מראה שגיאה:
> Could not find the 'link_url' column of 'social_posts' in the schema cache

הקוד מנסה לשמור `link_url` לטבלת `social_posts`, אבל **העמודה לא קיימת בבסיס הנתונים**. העמודה `link_url` קיימת ב-`auto_publish_items` אבל לא ב-`social_posts`.

### פתרון

| # | שינוי | פרטים |
|---|-------|--------|
| 1 | Migration חדש | הוסף עמודת `link_url TEXT NULL` לטבלת `social_posts` |
| 2 | עדכון types.ts | הוסף `link_url` לטיפוסי `social_posts` (Row, Insert, Update) |

**2 שינויים — migration + עדכון טיפוסים. אפס שינויים בלוגיקה.**

