import EnglishHeader from "@/components/en/Header";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[50vh] overflow-hidden">
        <img
          src="/images/en/hero-telaviv.jpg"
          alt="Contact Us"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <p className="font-montserrat text-sm tracking-widest uppercase text-white/80 mb-4">
              Get In Touch
            </p>
            <h1 className="reliz-hero-title text-white">
              Contact Us
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
                      +972-XX-XXXXXXX
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
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-playfair text-2xl font-normal mb-4 tracking-wide">
                CITY MARKET
              </h3>
              <p className="font-montserrat text-sm text-background/70">
                 Real Estate
              </p>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Quick Links
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p className="cursor-pointer hover:text-background transition-colors">Home</p>
                <p className="cursor-pointer hover:text-background transition-colors">Buy</p>
                <p className="cursor-pointer hover:text-background transition-colors">Rent</p>
                <p className="cursor-pointer hover:text-background transition-colors">Neighborhoods</p>
              </div>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Company
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p className="cursor-pointer hover:text-background transition-colors">About Us</p>
                <p className="cursor-pointer hover:text-background transition-colors">Contact</p>
                <p className="cursor-pointer hover:text-background transition-colors">Blog</p>
              </div>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Contact
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p>Tel Aviv, Israel</p>
                <p>info@citymarket.co.il</p>
                <p>+972-XX-XXXXXXX</p>
              </div>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center">
            <p className="font-montserrat text-sm text-background/70">
              © 2024 City Market Properties. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
