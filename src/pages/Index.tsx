import VideoHero from '@/components/he/VideoHero';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import DivisionCard from '@/components/DivisionCard';
import { ScrollAnimated } from '@/components/about/ScrollAnimated';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from "zod";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationSchema, WebSiteSchema, LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo/SchemaOrg';
import { HreflangMeta } from '@/components/seo/HreflangMeta';
import { ReviewsSchema } from '@/components/seo/ReviewsSchema';
import GoogleReviews from '@/components/GoogleReviews';
const contactSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים").max(100, "שם ארוך מדי"),
  email: z.string().email("כתובת אימייל לא תקינה").max(255, "אימייל ארוך מדי"),
  phone: z.string().min(9, "מספר טלפון לא תקין").max(15, "מספר טלפון ארוך מדי"),
  message: z.string().min(10, "הודעה חייבת להכיל לפחות 10 תווים").max(1000, "הודעה ארוכה מדי")
});
const Index = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = contactSchema.parse(contactForm);
      const {
        error
      } = await supabase.from('contact_leads').insert({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        message: validatedData.message,
        property_id: null
      });
      if (error) throw error;
      toast.success('הפנייה נשלחה בהצלחה! ניצור איתך קשר בהקדם האפשרי');
      setContactForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('אירעה שגיאה בשליחת הפנייה. אנא נסה שנית.');
      }
    }
  };
  const neighborhoods = [{
    id: "rothschild",
    name: "רוטשילד",
    image: "/images/en/neighborhoods/rothschild.jpg"
  }, {
    id: "neve-tzedek",
    name: "נווה צדק",
    image: "/images/en/neighborhoods/neve-tzedek.jpg"
  }, {
    id: "florentin",
    name: "פלורנטין",
    image: "/images/en/neighborhoods/florentin.jpg"
  }, {
    id: "dizengoff",
    name: "דיזנגוף",
    image: "/images/en/neighborhoods/dizengoff.jpg"
  }];
  const divisions = [{
    title: 'השכרות',
    description: 'מחפשים דירה להשכרה? אנחנו כאן בשבילכם',
    image: '/images/rental-interior.jpg',
    features: ['ליווי מקצועי בחיפוש הנכס המתאים', 'בדיקת דיירים מקיפה', 'ליווי במסמכים משפטיים', 'שירות אישי ומסור'],
    link: '/he/rentals',
    icon: 'users' as const
  }, {
    title: 'מכירות',
    description: 'קונים או מוכרים? אנחנו דואגים לעסקה המושלמת בביטחון ובמקצועיות',
    image: '/images/sales-villa.jpg',
    features: ['הערכת נכס מדויקת', 'שיווק מתקדם וממוקד', 'גישה לרשת אנשי מקצוע בתחום המשפטי והמסים'],
    link: '/he/sales',
    icon: 'trending' as const
  }, {
    title: 'ניהול נכסים',
    description: 'ניהול מקצועי ומלא עבור הנכס שלכם',
    image: '/images/management-lobby.jpg',
    features: ['ניהול תחזוקה שוטפת ופתרונות מהירים', 'גביה ודיווח חודשי', 'ניהול דיירים מקצועי', 'זמינות ושירות 24/7'],
    link: '/he/management',
    icon: 'building' as const
  }];
  const stats = [{
    icon: '24/7',
    label: 'זמינות מלאה',
    color: 'bg-primary'
  }, {
    icon: '+500',
    label: 'עסקאות מוצלחות',
    color: 'bg-secondary'
  }, {
    icon: '+15',
    label: 'שנות ניסיון',
    color: 'bg-primary'
  }];
  return <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>CITY MARKET Properties - נדל"ן בתל אביב | השכרות, מכירות וניהול נכסים</title>
        <meta name="description" content="מומחים בתיווך נדל&quot;ן, השכרות, מכירות וניהול נכסים בתל אביב. שירות מקצועי ומסור ללקוחות פרטיים ועסקיים." />
        <meta property="og:title" content="CITY MARKET Properties - נדל&quot;ן בתל אביב" />
        <meta property="og:description" content="מומחים בתיווך נדל&quot;ן, השכרות, מכירות וניהול נכסים בתל אביב" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he" />
      <OrganizationSchema language="he" />
      <WebSiteSchema language="he" />
      <LocalBusinessSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" }
      ]} />
      <HebrewHeader />
      
      {/* Hero Section */}
      <VideoHero title="City Market" imageUrl="/images/en/hero-last-one.png" />

      {/* About Section */}
      <ScrollAnimated animation="slide-in-up" className="py-4 md:py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-4 md:mb-6">
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground">
                CITY MARKET
              </h2>
              <p className="font-montserrat text-sm md:text-base text-muted-foreground tracking-widest">
                Properties
              </p>
            </div>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground leading-relaxed mb-6 md:mb-8">
              בסיטי מרקט נכסים אנו מעניקים שירות אישי ומקצועי לאורך כל תהליך הנדל״ן — מכירת דירות, השכרת נכסים וניהול נכסים מלא.
              הצוות שלנו מלווה אתכם בכל שלב, מציאת הנכס המושלם, התאמת שוכרים איכותיים, ועד לניהול שוטף ואחראי של הנכס.
            </p>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground leading-relaxed">
              בין אם אתם רוכשים בית חלומות, משכירים דירה או מחפשים צוות אמין שינהל עבורכם את ההשקעה — אנחנו כאן כדי להפוך את התהליך לחלק, מקצועי ומותאם בדיוק לצרכים שלכם.
            </p>
          </div>
        </div>
      </ScrollAnimated>

      {/* Divisions Section */}
      <ScrollAnimated animation="fade-in" delay={150} className="py-4 md:py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-3 md:mb-4">החטיבות שלנו</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {divisions.map(division => <DivisionCard key={division.title} {...division} />)}
          </div>
        </div>
      </ScrollAnimated>

      {/* Neighborhoods Guide */}
      <section className="py-4 md:py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-6">
              גלה את תל אביב
            </h2>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed text-center">תל אביב היא עיר תוססת ומגוונת, שבה לכל שכונה יש סיפור ייחודי משלה. מהקסם הבוהמייני של נווה צדק ועד האנרגיה הצעירה של פלורנטין, מהאלגנטיות של שדרות רוטשילד ועד הסצנה התרבותית העשירה של דיזנגוף, בכל פינה תמצאו חוויה אחרת. גלו את השכונה שמתאימה בדיוק לאורח החיים ולחלומות שלכם.
 הפסיפס הצבעוני והמגוון המרתק של תל אביב מחכים לכם.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {neighborhoods.map(neighborhood => <div key={neighborhood.id} onClick={() => navigate(`/he/neighborhoods/${neighborhood.id}`)} className="group relative aspect-[3/4] overflow-hidden cursor-pointer" role="button" aria-label={`חקור את שכונת ${neighborhood.name}`} tabIndex={0} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(`/he/neighborhoods/${neighborhood.id}`);
            }
          }}>
                <img src={neighborhood.image} alt={`שכונת ${neighborhood.name} - תמונת מדריך שכונות תל אביב`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 md:p-8">
                  <h3 className="font-playfair text-2xl md:text-3xl font-normal text-white tracking-wide">
                    {neighborhood.name}
                  </h3>
                  <div className="w-12 h-px bg-secondary/50 mt-4 transition-all duration-500 group-hover:w-20 group-hover:bg-secondary/80" />
                </div>
              </div>)}
          </div>

          <div className="text-center">
            <button onClick={() => navigate("/he/neighborhoods")} className="reliz-button">
              חקור את כל השכונות
            </button>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      

      {/* Contact Section */}
      <section className="py-4 md:py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="font-montserrat text-xs md:text-sm tracking-widest uppercase text-muted-foreground mb-3 md:mb-4">
                צור קשר
              </p>
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-4 md:mb-6">
                בואו נמצא את בית החלומות שלכם
              </h2>
              <p className="font-montserrat text-base md:text-lg text-muted-foreground px-4">
                פנו אלינו לתיאום סיור או לקבלת פרטים נוספים
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <input type="text" placeholder="שם" value={contactForm.name} onChange={e => setContactForm({
                ...contactForm,
                name: e.target.value
              })} className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base" />
                <input type="email" placeholder="אימייל" value={contactForm.email} onChange={e => setContactForm({
                ...contactForm,
                email: e.target.value
              })} className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base" />
              </div>
              <div className="space-y-4">
                <input type="tel" placeholder="054-123-4567" value={contactForm.phone} onChange={e => setContactForm({
                ...contactForm,
                phone: e.target.value
              })} className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base" />
                <textarea placeholder="הודעה" rows={4} value={contactForm.message} onChange={e => setContactForm({
                ...contactForm,
                message: e.target.value
              })} className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none text-sm md:text-base" />
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="text-center mt-6 md:mt-8">
              <button type="submit" className="reliz-button" aria-label="שלח הודעת WhatsApp">
                שלח הודעה
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      <ReviewsSchema language="he" />
      <GoogleReviews />

      {/* Footer */}
      <HebrewFooter />
    </div>;
};
export default Index;