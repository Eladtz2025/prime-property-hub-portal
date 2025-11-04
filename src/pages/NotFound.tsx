import { Link } from "react-router-dom";
import { Construction, Home, ArrowRight } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/10" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        {/* Icon Section */}
        <div className="mb-8 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm rounded-full p-8 border border-primary/20 shadow-elegant group-hover:shadow-glow transition-all duration-500">
              <Construction 
                className="text-primary animate-pulse" 
                size={80} 
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="font-playfair text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-l from-primary via-foreground to-secondary bg-clip-text text-transparent animate-fade-in">
          דף בבנייה
        </h1>
        
        {/* Subtitle */}
        <p className="font-montserrat text-xl md:text-2xl text-muted-foreground mb-4 leading-relaxed animate-fade-in-delay">
          אנחנו עובדים על משהו מיוחד עבורכם
        </p>
        
        <p className="font-montserrat text-base md:text-lg text-muted-foreground/80 mb-12 animate-fade-in-delay-2">
          הדף הזה יהיה זמין בקרוב עם תכנים חדשים ומרגשים
        </p>
        
        {/* CTA Button */}
        <Link 
          to="/en" 
          className="group inline-flex items-center gap-3 font-montserrat bg-gradient-to-l from-primary to-secondary text-white px-10 py-4 rounded-xl hover:shadow-glow transition-all duration-500 shadow-elegant hover:scale-105"
        >
          <Home size={20} />
          <span className="font-medium">חזרה לדף הבית</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={20} />
        </Link>
        
        {/* Progress Indicator */}
        <div className="mt-16 animate-fade-in-delay-3">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
            <div className="w-3 h-3 rounded-full bg-primary/60 animate-bounce delay-150" />
            <div className="w-3 h-3 rounded-full bg-primary/30 animate-bounce delay-300" />
          </div>
          <p className="text-sm text-muted-foreground font-montserrat">
            תודה על הסבלנות והאמון שלכם
          </p>
        </div>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default NotFound;
