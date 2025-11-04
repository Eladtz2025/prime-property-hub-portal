import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

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
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      contactSchema.parse(formData);
      
      const phone = '972545503055';
      const message = `Hello,\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      
      setFormData({ name: "", email: "", phone: "", message: "" });
      toast.success("Message sent successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>Contact Us - CITY MARKET Properties | Real Estate in Tel Aviv</title>
        <meta name="description" content="Contact CITY MARKET Properties. Experts in real estate brokerage, rentals, sales and property management in Tel Aviv. Phone: 054-550-3055" />
        <meta property="og:title" content="Contact Us - CITY MARKET Properties" />
        <meta property="og:description" content="Contact CITY MARKET real estate experts in Tel Aviv" />
        <link rel="canonical" href="https://citymarket.co.il/en/contact" />
      </Helmet>
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-contact.jpg"
          alt="Contact Us"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
            Contact Us
          </h1>
        </div>
      </section>

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
                    <p className="font-montserrat text-muted-foreground">
                      054-550-3055
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-montserrat text-sm tracking-widest uppercase text-foreground mb-2">
                      Email
                    </h3>
                    <p className="font-montserrat text-muted-foreground">
                      info@citymarket.co.il
                    </p>
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
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                    placeholder="+972-XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="font-montserrat text-sm tracking-wide uppercase text-foreground mb-2 block">
                    Message *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none"
                    placeholder="Tell us about your property needs..."
                  />
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
          <p className="font-montserrat text-muted-foreground">
            Map Integration
          </p>
        </div>
      </section>

      {/* Footer */}
      <EnglishFooter />
    </div>
  );
};

export default Contact;
