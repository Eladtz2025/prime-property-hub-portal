

## הדגשת "Since 2008" באנגלית כמו בעברית

### הבעיה
בעברית: `text-xs md:text-sm tracking-[0.3em] font-bold text-white`
באנגלית: `text-[10px] md:text-xs text-white/70 tracking-[0.3em]` — קטן יותר, חיוור, ללא bold

### התיקון

**`src/components/en/VideoHero.tsx` שורה 77:**
החלפת הכיתות לזהות לעברית:
```
text-xs md:text-sm tracking-[0.3em] mt-6 font-bold text-white
```

**קובץ אחד, שורה אחת.**

