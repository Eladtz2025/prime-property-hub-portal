import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const contactSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים").max(100, "שם ארוך מדי"),
  email: z.string().email("כתובת אימייל לא תקינה").max(255, "אימייל ארוך מדי"),
  phone: z.string().min(9, "מספר טלפון לא תקין").max(15, "מספר טלפון ארוך מדי"),
  message: z.string().min(10, "הודעה חייבת להכיל לפחות 10 תווים").max(1000, "הודעה ארוכה מדי")
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      contactSchema.parse(formData);
      
      const phone = '972545503055';
      const message = `שלום,\n\nשם: ${formData.name}\nאימייל: ${formData.email}\nטלפון: ${formData.phone}\n\nהודעה:\n${formData.message}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      
      setFormData({ name: "", email: "", phone: "", message: "" });
      toast.success("ההודעה נשלחה בהצלחה!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <HebrewHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-contact.jpg"
          alt="צור קשר"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              צור קשר
            </h1>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="font-playfair text-4xl font-normal tracking-wide text-foreground mb-8 text-right">
                בואו נתחבר
              </h2>
              <p className="font-montserrat text-lg text-muted-foreground mb-12 text-right">
                בין אם אתם מחפשים לקנות, למכור או להשכיר נכס בתל אביב, 
                הצוות שלנו כאן כדי לעזור. צרו איתנו קשר היום.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      כתובת
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      שדרות רוטשילד<br />
                      תל אביב, ישראל
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      טלפון
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      054-550-3055
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      אימייל
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      info@citymarket.co.il
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      שעות פעילות
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      ראשון - חמישי: 9:00 - 18:00<br />
                      שישי: 9:00 - 14:00<br />
                      שבת: סגור
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block text-right">
                    שם *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-right"
                    placeholder="שמך המלא"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block text-right">
                    אימייל *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-right"
                    placeholder="הדוא״ל שלך"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block text-right">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-right"
                    placeholder="054-XXX-XXXX"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block text-right">
                    הודעה *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none text-right"
                    placeholder="ספרו לנו על צרכי הנדל״ן שלכם..."
                  />
                </div>

                <button type="submit" className="reliz-button w-full">
                  שלח הודעה
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="h-96 bg-muted/30">
        <div className="w-full h-full flex items-center justify-center">
          <p className="font-montserrat text-muted-foreground">
            שילוב מפה
          </p>
        </div>
      </section>

      {/* Footer */}
      <HebrewFooter />
    </div>
  );
};

export default Contact;
