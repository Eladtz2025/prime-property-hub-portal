import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import VideoHero from "@/components/en/VideoHero";
import DivisionCard from "@/components/en/DivisionCard";
import { ConsultationModal } from "@/components/en/ConsultationModal";
import { useNavigate } from "react-router-dom";
import { Award, TrendingUp, Users } from "lucide-react";
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
const EnglishIndex = () => {
  const navigate = useNavigate();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
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
      toast.success('Your inquiry has been sent successfully! We will contact you shortly');
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
        toast.error('An error occurred while sending your inquiry. Please try again.');
      }
    }
  };
  const divisions = [{
    title: 'Rentals',
    description: 'Looking for a rental property? We are here for you',
    image: '/images/rental-interior.jpg',
    features: ['Professional property search', 'Comprehensive tenant screening', 'Legal documentation assistance', 'Personal dedicated service'],
    link: '/en/rentals',
    icon: 'users' as const
  }, {
    title: 'Sales',
    description: 'Buying or selling? We deliver the ideal deal with confidence and expertise.',
    image: '/images/sales-villa.jpg',
    features: ['Precise property valuation', 'Strategic, results-driven marketing', 'Access to our network of legal and tax professionals', 'Comprehensive negotiation support'],
    link: '/en/sales',
    icon: 'trending' as const
  }, {
    title: 'Property Management',
    description: 'Professional and comprehensive management for your property',
    image: '/images/management-lobby.jpg',
    features: ['Ongoing maintenance management', 'Monthly billing and reporting', 'Professional tenant relations', '24/7 availability'],
    link: '/en/management',
    icon: 'building' as const
  }];
  const neighborhoods = [{
    id: "rothschild",
    name: "Rothschild",
    image: "/images/en/neighborhoods/rothschild.jpg"
  }, {
    id: "neve-tzedek",
    name: "Neve Tzedek",
    image: "/images/en/neighborhoods/neve-tzedek.jpg"
  }, {
    id: "florentin",
    name: "Florentin",
    image: "/images/en/neighborhoods/florentin.jpg"
  }, {
    id: "dizengoff",
    name: "Dizengoff",
    image: "/images/en/neighborhoods/dizengoff.jpg"
  }];
  return <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>CITY MARKET Properties - Real Estate in Tel Aviv | Rentals, Sales & Property Management</title>
        <meta name="description" content="Experts in real estate brokerage, rentals, sales and property management in Tel Aviv. Professional and dedicated service for private and corporate clients." />
        <meta property="og:title" content="CITY MARKET Properties - Real Estate in Tel Aviv" />
        <meta property="og:description" content="Experts in real estate brokerage, rentals, sales and property management in Tel Aviv" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket.co.il/en" />
      </Helmet>
      <EnglishHeader />

      {/* Hero Section */}
      <VideoHero title="CITY MARKET" subtitle="Find your ideal home. Explore our exclusive listings." imageUrl="/images/en/hero-last-one.png" />

      {/* Consultation Modal */}
      <ConsultationModal open={isConsultationOpen} onOpenChange={setIsConsultationOpen} />

      {/* About Section */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
                CITY MARKET
              </h2>
              <p className="font-montserrat text-sm md:text-base text-muted-foreground tracking-widest">
                Properties
              </p>
            </div>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-8">
              At <strong>City Market Properties</strong>, we provide personalized real estate services across sales, rentals, and full property management.
              Our team guides you through every step, helping you find the ideal home or investment, secure qualified tenants, and manage your property with care and professionalism.
            </p>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              Whether you're buying, renting out your apartment, or seeking a trusted team to oversee your assets, we ensure a seamless, transparent experience tailored to your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-4">
              Our Divisions
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Sales • Rentals • Property Management
              <br />
              All in One Place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {divisions.map(division => <DivisionCard key={division.title} {...division} />)}
          </div>
        </div>
      </section>

      {/* Neighborhoods Guide */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              Discover Tel Aviv
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed text-center">
              Tel Aviv is a vibrant and diverse city, where every neighborhood has its own unique story. From the bohemian charm of Neve Tzedek to the youthful energy of Florentin, from the elegance of Rothschild Boulevard to the rich cultural scene of Dizengoff, every corner offers a different experience.

Discover the neighborhood that feels right for you, one that perfectly matches your lifestyle and dreams.

Come explore with us the colorful mosaic of Tel Aviv.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {neighborhoods.map(neighborhood => <div key={neighborhood.id} onClick={() => navigate(`/en/neighborhoods/${neighborhood.id}`)} className="group relative aspect-[3/4] overflow-hidden cursor-pointer" role="button" aria-label={`Explore ${neighborhood.name} neighborhood`} tabIndex={0} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(`/en/neighborhoods/${neighborhood.id}`);
            }
          }}>
                <img src={neighborhood.image} alt={`${neighborhood.name} neighborhood - Tel Aviv neighborhoods guide`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-center p-8">
                  <h3 className="font-playfair text-3xl font-normal text-white tracking-wide">
                    {neighborhood.name}
                  </h3>
                </div>
              </div>)}
          </div>

          <div className="text-center">
            <button onClick={() => navigate("/en/neighborhoods")} className="reliz-button">
              Explore All Neighborhoods
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      

      {/* Contact Section */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                Get In Touch
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
                Let&apos;s Find Your Dream Home
              </h2>
              <p className="font-montserrat text-lg text-muted-foreground">
                Contact us today to schedule a viewing or learn more about our exclusive properties.
              </p>
            </div>

            <form onSubmit={handleContactSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input type="text" placeholder="Name" required value={contactForm.name} onChange={e => setContactForm({
                  ...contactForm,
                  name: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" />
                  <input type="email" placeholder="Email" required value={contactForm.email} onChange={e => setContactForm({
                  ...contactForm,
                  email: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" />
                </div>
                <div className="space-y-4">
                  <input type="tel" placeholder="Phone" required value={contactForm.phone} onChange={e => setContactForm({
                  ...contactForm,
                  phone: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat" />
                  <textarea placeholder="Message" required rows={4} value={contactForm.message} onChange={e => setContactForm({
                  ...contactForm,
                  message: e.target.value
                })} className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none" />
                </div>
              </div>

              <div className="text-center mt-8">
                <button type="submit" className="reliz-button" aria-label="Send WhatsApp message">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <EnglishFooter />
    </div>;
};
export default EnglishIndex;