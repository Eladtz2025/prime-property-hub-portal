import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center px-4">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Construction 
              className="text-primary" 
              size={120} 
              strokeWidth={1.5}
            />
            <div className="absolute -bottom-2 -right-2 bg-primary/10 rounded-full p-3">
              <Construction 
                className="text-primary/40" 
                size={40} 
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>
        
        <h1 className="font-playfair text-5xl md:text-6xl font-bold text-foreground mb-4">
          דף בבנייה
        </h1>
        
        <p className="font-montserrat text-xl md:text-2xl text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          אנחנו עובדים על משהו מיוחד.
          <br />
          הדף הזה יהיה זמין בקרוב!
        </p>
        
        <Link 
          to="/" 
          className="inline-block font-montserrat bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          חזרה לדף הבית
        </Link>
        
        <div className="mt-12 text-sm text-muted-foreground font-montserrat">
          <p>תודה על הסבלנות שלכם 🏗️</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
