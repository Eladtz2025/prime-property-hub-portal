import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { Award, Users, TrendingUp, Heart, Building, MapPin, Sparkles, Home } from "lucide-react";
import { Helmet } from "react-helmet";
import { StatCounter } from "@/components/about/StatCounter";
import { TimelineItem } from "@/components/about/TimelineItem";
import { ValueCard } from "@/components/about/ValueCard";
import { TeamCard } from "@/components/about/TeamCard";
import { TestimonialCard } from "@/components/about/TestimonialCard";
import { ScrollAnimated } from "@/components/about/ScrollAnimated";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import testimonial images
import davidCohenReview from "@/assets/reviews/david-cohen.jpg";
import sarahLeviReview from "@/assets/reviews/sarah-levi.jpg";
import michalGolanReview from "@/assets/reviews/michal-golan.jpg";
import yossiAbrahamReview from "@/assets/reviews/yossi-abraham.jpg";
import roiIsraeliReview from "@/assets/reviews/roi-israeli.jpg";

const About = () => {
  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <title>אודות City Market Properties - מומחי נדל&quot;ן יוקרה בתל אביב</title>
        <meta name="description" content="למעלה מ-15 שנות ניסיון בשוק הנדל&quot;ן של תל אביב. מומחיות במכירות, השכרות וניהול נכסי יוקרה בשכונות המובחרות." />
        <meta property="og:title" content="אודות City Market Properties - מומחי נדל&quot;ן יוקרה בתל אביב" />
        <meta property="og:description" content="למעלה מ-15 שנות ניסיון בשוק הנדל&quot;ן של תל אביב. מומחיות במכירות, השכרות וניהול נכסי יוקרה בשכונות המובחרות." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket-properties.com/about" />
      </Helmet>
      <HebrewHeader />

      {/* Hero Section - Enhanced */}
      <FullScreenHero
        title="אנחנו לא רק מוכרים נכסים"
        subtitle="אנחנו משנים חיים"
        backgroundImage="/images/hero-about.jpg"
        minHeight="50vh"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto mt-8 md:mt-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <StatCounter end={15} label="שנות ניסיון" />
          <StatCounter end={500} label="נכסים נמכרו" />
          <StatCounter end={12} label="שכונות בתל אביב" />
          <StatCounter end={98} label="שביעות רצון" suffix="%" />
        </div>
      </FullScreenHero>

      {/* Our Story Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                המסע שלנו
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                הסיפור שלנו
              </h2>
            </div>
          </ScrollAnimated>
          
          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 h-full w-1 bg-primary/20 transform -translate-x-1/2 hidden md:block" />
            
            <TimelineItem 
              year="2008" 
              title="הקמת החברה" 
              description="התחלנו כסוכנות בוטיק קטנה עם חזון גדול"
              icon={<Building className="w-8 h-8" />} 
              side="right" 
            />
            <TimelineItem 
              year="2012" 
              title="התרחבות ל-5 שכונות" 
              description="הרחבת הפעילות לשכונות המובילות בתל אביב"
              icon={<MapPin className="w-8 h-8" />} 
              side="left" 
            />
            <TimelineItem 
              year="2018" 
              title="אבן דרך של 500+ נכסים" 
              description="חצינו את רף ה-500 נכסים שנמכרו בהצלחה"
              icon={<Award className="w-8 h-8" />} 
              side="right" 
            />
            <TimelineItem 
              year="2023" 
              title="מהפכה דיגיטלית" 
              description="השקת פלטפורמת ניהול נכסים חכמה ומתקדמת"
              icon={<Sparkles className="w-8 h-8" />} 
              side="left" 
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                מה מניע אותנו
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                הערכים שלנו
              </h2>
            </div>
          </ScrollAnimated>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <ValueCard 
              icon={<Award className="w-full h-full" />}
              title="מצוינות"
              description="אנו שואפים לשלמות בכל פרט בשירות שלנו"
              delay={0}
            />
            <ValueCard 
              icon={<Heart className="w-full h-full" />}
              title="יושרה"
              description="כנות ושקיפות מנחות את כל הקשרים שלנו"
              delay={100}
            />
            <ValueCard 
              icon={<Users className="w-full h-full" />}
              title="מסירות"
              description="שביעות הרצון שלכם היא העדיפות הגבוהה ביותר שלנו"
              delay={200}
            />
            <ValueCard 
              icon={<TrendingUp className="w-full h-full" />}
              title="חדשנות"
              description="מינוף טכנולוגיה לתוצאות מעולות"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                פגשו את המומחים
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                הצוות שלנו
              </h2>
            </div>
          </ScrollAnimated>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <TeamCard
              image="/team1/david-cohen.jpg"
              name="דוד כהן"
              role="מייסד ומנכ״ל"
              experience="15+ שנות ניסיון"
              delay={0}
            />
            <TeamCard
              image="/team1/sarah-levi.jpg"
              name="שרה לוי"
              role="מנהלת מכירות"
              experience="10+ שנות ניסיון"
              delay={100}
            />
            <TeamCard
              image="/team1/yossi-abraham.jpg"
              name="יוסי אברהם"
              role="מנהל השכרות"
              experience="8+ שנות ניסיון"
              delay={200}
            />
            <TeamCard
              image="/team1/michal-golan.jpg"
              name="מיכל גולן"
              role="מנהלת ניהול נכסים"
              experience="12+ שנות ניסיון"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                מה הלקוחות שלנו אומרים
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                המלצות לקוחות
              </h2>
            </div>
          </ScrollAnimated>
          
          <div className="max-w-5xl mx-auto">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={sarahLeviReview}
                    name="שרה לוי"
                    rating={5}
                    text="City Market עזרו לנו למצוא את דירת החלומות שלנו בנווה צדק. שירות מקצועי ואדיב, המלצה בחום!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={davidCohenReview}
                    name="דוד כהן"
                    rating={5}
                    text="מקצועיות ברמה גבוהה. מכרתי דרכם דירה ברוטשילד במהירות ובמחיר מעולה. תודה רבה!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={michalGolanReview}
                    name="מיכל גולן"
                    rating={5}
                    text="ניהול הנכסים שלי בצורה מושלמת. תמיד זמינים, אמינים ומקצועיים. ממליצה בחום!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={yossiAbrahamReview}
                    name="יוסי אברהם"
                    rating={5}
                    text="השכרתי דרכם דירה בדיזנגוף. התהליך היה חלק ומהיר, ממליץ בחום!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={roiIsraeliReview}
                    name="רועי ישראלי"
                    rating={5}
                    text="שירות יוצא דופן מההתחלה ועד הסוף. מצאו את הנכס המושלם למשפחה שלי בזמן שיא!"
                  />
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollAnimated>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              מוכנים למצוא את הנכס המושלם?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              בואו נתחיל את המסע שלכם היום
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-scale">
                <Home className="ml-2 h-5 w-5" />
                קבעו פגישת ייעוץ
              </Button>
              <Button size="lg" variant="outline" className="hover-scale">
                צרו קשר עכשיו
              </Button>
            </div>
          </ScrollAnimated>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default About;
