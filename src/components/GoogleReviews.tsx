import { Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import davidCohen from '@/assets/reviews/david-cohen.jpg';
import sarahLevi from '@/assets/reviews/sarah-levi.jpg';
import yossiAbraham from '@/assets/reviews/yossi-abraham.jpg';
import michalGolan from '@/assets/reviews/michal-golan.jpg';
import roiIsraeli from '@/assets/reviews/roi-israeli.jpg';

const reviews = [
  {
    id: 1,
    name: 'דוד כהן',
    image: davidCohen,
    rating: 5,
    date: 'לפני 3 שבועות',
    text: 'שירות מקצועי ואדיב! עזרו לי למצוא את הדירה המושלמת בלב תל אביב. ממליץ בחום!',
    initials: 'דכ'
  },
  {
    id: 2,
    name: 'שרה לוי',
    image: sarahLevi,
    rating: 5,
    date: 'לפני חודש',
    text: 'החברה הכי מקצועית שעבדתי איתה. תהליך מכירת הדירה היה חלק ויעיל. תודה רבה!',
    initials: 'של'
  },
  {
    id: 3,
    name: 'יוסי אברהם',
    image: yossiAbraham,
    rating: 5,
    date: 'לפני חודשיים',
    text: 'שירות ניהול נכסים מעולה. תמיד זמינים ומטפלים בכל בעיה במהירות ובמקצועיות.',
    initials: 'יא'
  },
  {
    id: 4,
    name: 'מיכל גולן',
    image: michalGolan,
    rating: 5,
    date: 'לפני 3 חודשים',
    text: 'מצאו לי דירה להשכרה בדיוק לפי מה שחיפשתי. צוות נעים ומקצועי!',
    initials: 'מג'
  },
  {
    id: 5,
    name: 'רועי ישראלי',
    image: roiIsraeli,
    rating: 5,
    date: 'לפני 4 חודשים',
    text: 'הייעוץ שקיבלתי היה מצוין. עזרו לי להשקיע נכון ולמצוא נכס משתלם.',
    initials: 'רי'
  }
];

const GoogleReviews = () => {
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">מה הלקוחות שלנו אומרים</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-secondary text-secondary" />
            ))}
          </div>
          <p className="text-muted-foreground">
            מבוסס על ביקורות Google
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
            direction: "rtl",
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.image} alt={review.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {review.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{review.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.text}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default GoogleReviews;