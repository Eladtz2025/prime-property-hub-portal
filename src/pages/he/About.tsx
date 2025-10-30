import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { Award, Users, TrendingUp, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen english-luxury" dir="rtl">
      <HebrewHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-about.jpg"
          alt="אודות City Market"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white tracking-wide">
            אודות City Market
          </h1>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-8">
              המשימה שלנו
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-6">
              ב-City Market Properties, אנו מחויבים לספק שירות ללא תחרות בשוק הנדל"ן. 
              עם למעלה מ-15 שנות ניסיון בשכונות היוקרתיות ביותר של תל אביב, אנו מחברים 
              לקוחות מובחרים עם נכסי החלומות שלהם.
            </p>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              המומחיות שלנו משתרעת על פני מכירות, השכרות וניהול נכסים, ומבטיחה חוויה 
              חלקה מהייעוץ הראשוני ועד לעסקה הסופית ומעבר לה.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              מה מניע אותנו
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              הערכים שלנו
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                מצוינות
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                אנו שואפים לשלמות בכל פרט בשירות שלנו
              </p>
            </div>

            <div className="text-center">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                יושרה
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                כנות ושקיפות מנחות את כל הקשרים שלנו
              </p>
            </div>

            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                מסירות
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                שביעות הרצון שלכם היא העדיפות הגבוהה ביותר שלנו
              </p>
            </div>

            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                חדשנות
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                מינוף טכנולוגיה לתוצאות מעולות
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              פגשו את המומחים
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              הצוות שלנו
            </h2>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              הצוות שלנו של אנשי מקצוע מנוסים מביא יחד עשרות שנות מומחיות משולבת 
              בשוק הנדל"ן של תל אביב. כל חבר צוות מחויב לספק שירות אישי וייעוץ מקצועי 
              לאורך כל המסע הנדל"ני שלכם.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HebrewFooter />
    </div>
  );
};

export default About;
