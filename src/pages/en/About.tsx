import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
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

      {/* Hero Section - Enhanced */}
      <FullScreenHero
        title="We Don't Just Sell Properties"
        subtitle="We Transform Lives"
        backgroundImage="/images/hero-about.jpg"
        minHeight="50vh"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto mt-8 md:mt-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <StatCounter end={15} label="Years Experience" />
          <StatCounter end={500} label="Properties Sold" />
          <StatCounter end={12} label="Tel Aviv Neighborhoods" />
          <StatCounter end={98} label="Client Satisfaction" suffix="%" />
        </div>
      </FullScreenHero>

      {/* Our Story Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                Our Journey
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                Our Story
              </h2>
            </div>
          </ScrollAnimated>
          
          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 h-full w-1 bg-primary/20 transform -translate-x-1/2 hidden md:block" />
            
            <TimelineItem 
              year="2008" 
              title="Company Founded" 
              description="Started as a small boutique agency with a big vision"
              icon={<Building className="w-8 h-8" />} 
              side="left" 
            />
            <TimelineItem 
              year="2012" 
              title="Expanded to 5 Neighborhoods" 
              description="Extended operations to Tel Aviv's premier neighborhoods"
              icon={<MapPin className="w-8 h-8" />} 
              side="right" 
            />
            <TimelineItem 
              year="2018" 
              title="500+ Properties Milestone" 
              description="Reached the 500 successfully sold properties mark"
              icon={<Award className="w-8 h-8" />} 
              side="left" 
            />
            <TimelineItem 
              year="2023" 
              title="Digital Transformation" 
              description="Launched smart property management platform"
              icon={<Sparkles className="w-8 h-8" />} 
              side="right" 
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
                What Drives Us
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                Our Values
              </h2>
            </div>
          </ScrollAnimated>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <ValueCard 
              icon={<Award className="w-full h-full" />}
              title="Excellence"
              description="We strive for perfection in every detail of our service"
              delay={0}
            />
            <ValueCard 
              icon={<Heart className="w-full h-full" />}
              title="Integrity"
              description="Honesty and transparency guide all our relationships"
              delay={100}
            />
            <ValueCard 
              icon={<Users className="w-full h-full" />}
              title="Dedication"
              description="Your satisfaction is our highest priority"
              delay={200}
            />
            <ValueCard 
              icon={<TrendingUp className="w-full h-full" />}
              title="Innovation"
              description="Leveraging technology for superior results"
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
                Meet The Experts
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                Our Team
              </h2>
            </div>
          </ScrollAnimated>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <TeamCard
              image="/team1/david-cohen.jpg"
              name="David Cohen"
              role="Founder & CEO"
              experience="15+ years experience"
              delay={0}
            />
            <TeamCard
              image="/team1/sarah-levi.jpg"
              name="Sarah Levi"
              role="Sales Director"
              experience="10+ years experience"
              delay={100}
            />
            <TeamCard
              image="/team1/yossi-abraham.jpg"
              name="Yossi Abraham"
              role="Rentals Manager"
              experience="8+ years experience"
              delay={200}
            />
            <TeamCard
              image="/team1/michal-golan.jpg"
              name="Michal Golan"
              role="Property Management Director"
              experience="12+ years experience"
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
                What Our Clients Say
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                Client Testimonials
              </h2>
            </div>
          </ScrollAnimated>
          
          <div className="max-w-5xl mx-auto">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={sarahLeviReview}
                    name="Sarah Levi"
                    rating={5}
                    text="City Market helped us find our dream apartment in Neve Tzedek. Professional and caring service, highly recommended!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={davidCohenReview}
                    name="David Cohen"
                    rating={5}
                    text="High-level professionalism. Sold my apartment on Rothschild quickly and at an excellent price. Thank you!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={michalGolanReview}
                    name="Michal Golan"
                    rating={5}
                    text="Managing my properties perfectly. Always available, reliable and professional. Highly recommend!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={yossiAbrahamReview}
                    name="Yossi Abraham"
                    rating={5}
                    text="Rented an apartment on Dizengoff through them. The process was smooth and fast, highly recommend!"
                  />
                </CarouselItem>
                <CarouselItem className="md:basis-1/2">
                  <TestimonialCard
                    image={roiIsraeliReview}
                    name="Roi Israeli"
                    rating={5}
                    text="Exceptional service from start to finish. Found the perfect property for my family in record time!"
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
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Let's start your journey today
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="hover-scale">
                <Home className="mr-2 h-5 w-5" />
                Schedule a Consultation
              </Button>
              <Button size="lg" variant="outline" className="hover-scale">
                Contact Us Now
              </Button>
            </div>
          </ScrollAnimated>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default About;
