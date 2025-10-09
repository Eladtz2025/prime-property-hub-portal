import { Star } from 'lucide-react';

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
        
        {/* Placeholder for future Google Reviews integration */}
        <div className="text-center text-muted-foreground">
          <p>ביקורות הלקוחות שלנו יופיעו כאן בקרוב</p>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;