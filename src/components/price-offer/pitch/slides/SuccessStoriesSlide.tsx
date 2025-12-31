import { Quote, Calendar, TrendingUp } from "lucide-react";

interface SuccessStory {
  image?: string;
  address: string;
  askingPrice: number;
  soldPrice: number;
  daysOnMarket: number;
  testimonial?: string;
  clientName?: string;
}

interface SuccessStoriesSlideProps {
  title?: string;
  subtitle?: string;
  stories?: SuccessStory[];
}

const SuccessStoriesSlide = ({
  title = "עסקאות אחרונות שלי",
  subtitle = "תוצאות אמיתיות ללקוחות אמיתיים",
  stories = [
    {
      address: "דירת 4 חדרים, רחוב ארלוזורוב",
      askingPrice: 4200000,
      soldPrice: 4350000,
      daysOnMarket: 18,
      testimonial: "טלי הצליחה למכור את הדירה שלנו תוך פחות מ-3 שבועות, במחיר גבוה מהציפיות!",
      clientName: "משפחת כהן",
    },
    {
      address: "פנטהאוז, מגדלי הים",
      askingPrice: 12000000,
      soldPrice: 12500000,
      daysOnMarket: 35,
      testimonial: "מקצועיות ברמה הגבוהה ביותר. ליווי צמוד לאורך כל התהליך.",
      clientName: "דוד ל.",
    },
    {
      address: "דירת גן, רמת אביב",
      askingPrice: 6500000,
      soldPrice: 6400000,
      daysOnMarket: 21,
      testimonial: "למרות שוק מאתגר, טלי מצאה קונה איכותי במהירות.",
      clientName: "רונית מ.",
    },
  ],
}: SuccessStoriesSlideProps) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    return `₪${price.toLocaleString()}`;
  };

  const getPriceDiff = (asking: number, sold: number) => {
    const diff = ((sold - asking) / asking) * 100;
    return diff;
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Stories Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((story, index) => {
            const priceDiff = getPriceDiff(story.askingPrice, story.soldPrice);
            const isAboveAsking = priceDiff > 0;

            return (
              <div
                key={index}
                className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30"
              >
                {/* Image placeholder or gradient */}
                <div className="relative h-32 bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
                  {story.image ? (
                    <img src={story.image} alt={story.address} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl">🏠</span>
                    </div>
                  )}
                  {/* Badge */}
                  {isAboveAsking && (
                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                      <TrendingUp className="h-3 w-3" />
                      +{priceDiff.toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-3 font-semibold text-white">{story.address}</h3>

                  {/* Price comparison */}
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-white/5 p-3">
                    <div>
                      <p className="text-xs text-white/50">מחיר מבוקש</p>
                      <p className="font-medium text-white/70">{formatPrice(story.askingPrice)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-white/50">נמכר ב-</p>
                      <p className="font-bold text-emerald-400">{formatPrice(story.soldPrice)}</p>
                    </div>
                  </div>

                  {/* Days on market */}
                  <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
                    <Calendar className="h-4 w-4" />
                    <span>{story.daysOnMarket} ימים על השוק</span>
                  </div>

                  {/* Testimonial */}
                  {story.testimonial && (
                    <div className="mt-auto border-t border-white/10 pt-4">
                      <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 flex-shrink-0 text-emerald-400/50" />
                        <p className="text-sm italic text-white/60">"{story.testimonial}"</p>
                      </div>
                      {story.clientName && (
                        <p className="mt-2 text-right text-xs text-white/40">— {story.clientName}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SuccessStoriesSlide;
