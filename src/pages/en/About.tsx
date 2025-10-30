import EnglishHeader from "@/components/en/Header";
import { Award, Users, TrendingUp, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-about.jpg"
          alt="About City Market"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white tracking-wide">
            About City Market
          </h1>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-8">
              Our Mission
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-6">
               At City Market Properties, we are committed to providing unparalleled service 
              in the property market. With over 15 years of experience in Tel Aviv's most
              prestigious neighborhoods, we connect discerning clients with their dream properties.
            </p>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              Our expertise spans across sales, rentals, and property management, ensuring a 
              seamless experience from initial consultation to final transaction and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              What Drives Us
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              Our Values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                Excellence
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                We strive for perfection in every detail of our service
              </p>
            </div>

            <div className="text-center">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                Integrity
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                Honesty and transparency guide all our relationships
              </p>
            </div>

            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                Dedication
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                Your satisfaction is our highest priority
              </p>
            </div>

            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
                Innovation
              </h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                Leveraging technology for superior results
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
              Meet The Experts
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              Our Team
            </h2>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
               Our team of experienced professionals brings together decades of combined expertise 
              in Tel Aviv's real estate market. Each member is dedicated to providing
              personalized service and expert guidance throughout your property journey.
            </p>
          </div>
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

export default About;
