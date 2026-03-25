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
    <section className="py-8 sm:py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold">Google</span>
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold mr-1 sm:mr-2">5.0</span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            מבוסס על 150 ביקורות
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
          <CarouselContent className="-ml-2 sm:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card className="h-full shadow-sm">
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={review.image} alt={review.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {review.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{review.name}</h4>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.text}
                    </p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        ביקורת Google
                        <svg className="w-3 h-3" viewBox="0 0 48 48" fill="none">
                          <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#4285F4"/>
                        </svg>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-6">
            <CarouselPrevious className="static" />
            <CarouselNext className="static" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default GoogleReviews;