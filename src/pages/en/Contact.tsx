import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  phone: z.string().min(9, "Invalid phone number").max(15, "Phone number is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message is too long")
});
const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = contactSchema.parse(formData);
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
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
      toast.success("Message sent successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred while sending");
      }
    }
  };
  return <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>Contact Us - CITY MARKET Properties | Real Estate in Tel Aviv</title>
        <meta name="description" content="Contact CITY MARKET Properties. Experts in real estate brokerage, rentals, sales and property management in Tel Aviv. Phone: 054-228-4477" />
        <meta property="og:title" content="Contact Us - CITY MARKET Properties" />
        <meta property="og:description" content="Contact CITY MARKET real estate experts in Tel Aviv" />
        <link rel="canonical" href="https://citymarket.co.il/en/contact" />
      </Helmet>
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero title="Contact Us" backgroundImage="/images/hero-contact.jpg" minHeight="50vh" />

      {/* Contact Form & Info */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="font-playfair text-4xl font-normal tracking-wide text-foreground mb-8">
                Let's Connect
              </h2>
              <p className="font-montserrat text-lg text-muted-foreground mb-12">
                Whether you're looking to buy, sell, or rent property in Tel Aviv, 
                our team is here to help. Reach out to us today.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      Address
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      Rothschild Boulevard<br />
                      Tel Aviv, Israel
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      Phone
                    </h3>
                    <a 
                      href="tel:+972542284477" 
                      className="font-montserrat text-muted-foreground hover:text-primary transition-colors cursor-pointer underline"
                    >
                      054-228-4477
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      Email
                    </h3>
                    <a 
                      href="mailto:citymarketlv@gmail.com" 
                      className="font-montserrat text-muted-foreground hover:text-primary transition-colors cursor-pointer underline"
                    >
                      citymarketlv@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      Hours
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      Sunday - Thursday: 9:00 AM - 6:00 PM<br />
                      Friday: 9:00 AM - 2:00 PM<br />
                      Saturday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Name *
                  </label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" placeholder="Your name" />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Email *
                  </label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" placeholder="your@email.com" />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Phone
                  </label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" placeholder="+972-XX-XXXXXXX" />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Message *
                  </label>
                  <textarea required value={formData.message} onChange={e => setFormData({
                  ...formData,
                  message: e.target.value
                })} rows={6} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none" placeholder="Tell us about your property needs..." />
                </div>

                <button type="submit" className="reliz-button w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="h-96 bg-muted/30">
        <div className="w-full h-full flex items-center justify-center">
          
        </div>
      </section>

      <EnglishFooter />
    </div>;
};
export default Contact;