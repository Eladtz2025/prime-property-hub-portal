

## תיקון ChecksSubTabs במובייל בלבד

### בעיה
הטאבים (`flex-wrap` עם `min-w-[80px]`) גולשים לשתי שורות או נחתכים במובייל (384px). בנוסף, במובייל הטקסט מוסתר (`hidden sm:inline`) אז נשארים רק אייקונים ב-5 כפתורים רחבים מדי.

### פתרון (`src/components/scout/checks/ChecksSubTabs.tsx`)
- הסרת `flex-wrap` ו-`min-w-[80px]` — במקום זה `overflow-x-auto scrollbar-none` כדי לאפשר גלילה אופקית
- הצגת הטקסט תמיד (הסרת `hidden sm:inline`) — במובייל הטאבים מספיק צרים שגלילה אופקית תפתור
- הסרת `flex-1` כדי שכל טאב יתפוס רק את הרוחב שהוא צריך
- הוספת `whitespace-nowrap shrink-0` לכל טריגר

דסקטופ לא מושפע — הטאבים ממילא נכנסים בשורה אחת.

