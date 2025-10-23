import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, DollarSign, Wrench, FileText, Phone, TrendingUp } from "lucide-react";

const EnglishManagement = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <DollarSign className="w-10 h-10 text-primary" />,
      title: "Rent Collection",
      description: "Automated rent collection and financial reporting. Never worry about late payments again.",
    },
    {
      icon: <Wrench className="w-10 h-10 text-primary" />,
      title: "Maintenance",
      description: "24/7 maintenance coordination with vetted contractors. Quick response to tenant needs.",
    },
    {
      icon: <FileText className="w-10 h-10 text-primary" />,
      title: "Legal Compliance",
      description: "Full legal compliance and documentation. Stay protected with expert lease management.",
    },
    {
      icon: <Phone className="w-10 h-10 text-primary" />,
      title: "Tenant Relations",
      description: "Professional tenant screening and communication. Quality tenants, happy owners.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-primary" />,
      title: "Financial Optimization",
      description: "Maximize your ROI with strategic pricing and cost management.",
    },
    {
      icon: <Shield className="w-10 h-10 text-primary" />,
      title: "Property Protection",
      description: "Regular inspections and preventive maintenance to preserve your investment.",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src="/images/en/hero-telaviv.jpg"
          alt="Property Management"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <p className="font-montserrat text-sm tracking-widest uppercase text-white/80 mb-4">
              Professional Services
            </p>
            <h1 className="reliz-hero-title text-white">
              Property Management
            </h1>
            <p className="reliz-subtitle text-white/90 mt-6 max-w-2xl mx-auto">
              Maximize Your Investment, Minimize Your Stress
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              What We Manage
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              From single apartments to entire buildings, we handle everything
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="font-montserrat text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Ready to Partner with Experts?
          </h2>
          <p className="font-montserrat text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Let us handle the details while you enjoy peace of mind and consistent returns
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="font-montserrat font-semibold px-8"
          >
            Get a Free Consultation
          </Button>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default EnglishManagement;
