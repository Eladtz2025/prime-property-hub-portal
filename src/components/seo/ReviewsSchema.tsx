import { Helmet } from "react-helmet";

const BASE_URL = "https://www.ctmarketproperties.com";

interface ReviewsSchemaProps {
  language: 'he' | 'en';
}

export const ReviewsSchema = ({ language }: ReviewsSchemaProps) => {
  const reviews = [
    {
      author: language === 'he' ? 'דוד כהן' : 'David Cohen',
      date: '2025-12-15',
      text: language === 'he' 
        ? 'שירות מקצועי ואדיב! עזרו לי למצוא את הדירה המושלמת בלב תל אביב. ממליץ בחום!'
        : 'Professional and courteous service! They helped me find the perfect apartment in the heart of Tel Aviv. Highly recommended!',
      rating: 5
    },
    {
      author: language === 'he' ? 'שרה לוי' : 'Sarah Levi',
      date: '2025-12-01',
      text: language === 'he'
        ? 'החברה הכי מקצועית שעבדתי איתה. תהליך מכירת הדירה היה חלק ויעיל. תודה רבה!'
        : 'The most professional company I have worked with. The apartment sale process was smooth and efficient. Thank you very much!',
      rating: 5
    },
    {
      author: language === 'he' ? 'יוסי אברהם' : 'Yossi Abraham',
      date: '2025-11-01',
      text: language === 'he'
        ? 'שירות ניהול נכסים מעולה. תמיד זמינים ומטפלים בכל בעיה במהירות ובמקצועיות.'
        : 'Excellent property management service. Always available and handle every issue quickly and professionally.',
      rating: 5
    },
    {
      author: language === 'he' ? 'מיכל גולן' : 'Michal Golan',
      date: '2025-10-01',
      text: language === 'he'
        ? 'מצאו לי דירה להשכרה בדיוק לפי מה שחיפשתי. צוות נעים ומקצועי!'
        : 'They found me a rental apartment exactly as I was looking for. Pleasant and professional team!',
      rating: 5
    },
    {
      author: language === 'he' ? 'רועי ישראלי' : 'Roi Israeli',
      date: '2025-09-01',
      text: language === 'he'
        ? 'הייעוץ שקיבלתי היה מצוין. עזרו לי להשקיע נכון ולמצוא נכס משתלם.'
        : 'The consultation I received was excellent. They helped me invest wisely and find a profitable property.',
      rating: 5
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#business`,
    "name": "CITY MARKET Properties",
    "image": `${BASE_URL}/logo.png`,
    "url": BASE_URL,
    "telephone": "+972-3-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rothschild Boulevard",
      "addressLocality": "Tel Aviv",
      "addressCountry": "IL"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "datePublished": review.date,
      "reviewBody": review.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default ReviewsSchema;
