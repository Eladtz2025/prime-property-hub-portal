import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { Award, Users, TrendingUp, Heart } from "lucide-react";
import { Helmet } from "react-helmet";

const About = () => {
  return (
    <>
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>About Us - City Market Properties | Tel Aviv Real Estate Experts</title>
        <meta name="description" content="Learn about City Market Properties - Over 15 years of experience in Tel Aviv's prestigious real estate market. Expert service in sales, rentals, and property management." />
        <meta property="og:title" content="About Us - City Market Properties" />
        <meta property="og:description" content="Tel Aviv's leading real estate experts with 15+ years of experience in luxury properties." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket.co.il/en/about" />
      </Helmet>
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
         <img
           src="/images/hero-about.jpg"
           alt="About City Market Properties - Tel Aviv Real Estate"
           className="absolute inset-0 w-full h-full object-cover"
           loading="eager"
           decoding="async"
         />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
            About Us
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

    </div>
    <EnglishFooter />
    </>
  );
};

export default About;
