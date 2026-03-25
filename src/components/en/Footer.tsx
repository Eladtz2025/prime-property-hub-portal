import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const EnglishFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <h3 className="font-playfair text-2xl font-normal tracking-wide">
                CITY MARKET
              </h3>
              <p className="font-montserrat text-xs text-background/70 tracking-widest">
                Properties
              </p>
            </div>
            <p className="font-montserrat text-sm text-background/70 mb-6">
              Experts in real estate brokerage, rentals, sales and property management in Tel Aviv.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/citymarket/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-background/90 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/Ctmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-background/90 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4 font-semibold">
              Services
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/sales')}
              >
                Buy
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/rentals')}
              >
                Rent
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/management')}
              >
                Property Management
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/new-developments')}
              >
                New Developments
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/insights')}
              >
                Insights
              </p>
            </div>
          </div>

          {/* Areas */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4 font-semibold">
              Areas
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/neighborhoods/neve-tzedek')}
              >
                Neve Tzedek
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/neighborhoods/rothschild')}
              >
                Rothschild
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/neighborhoods/florentin')}
              >
                Florentin
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/neighborhoods/old-north')}
              >
                Old North
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4 font-semibold">
              Contact
            </h4>
            <ul className="space-y-3 font-montserrat text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:0542284477" className="hover:text-background transition-colors">
                  054-228-4477
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:citymarketlv@gmail.com" className="hover:text-background transition-colors">
                  citymarketlv@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Tel Aviv, Israel</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Links Bar */}
        <div className="border-t border-background/20 pt-6 mb-6">
          <div className="flex flex-wrap justify-center gap-6 font-montserrat text-xs text-background/60">
            <span 
              className="cursor-pointer hover:text-background transition-colors"
              onClick={() => navigate('/en')}
            >
              Home
            </span>
            <span className="text-background/30">|</span>
            <span 
              className="cursor-pointer hover:text-background transition-colors"
              onClick={() => navigate('/en/about')}
            >
              About
            </span>
            <span className="text-background/30">|</span>
            <span 
              className="cursor-pointer hover:text-background transition-colors"
              onClick={() => navigate('/en/contact')}
            >
              Contact
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="font-montserrat text-xs text-background/50">
            © {currentYear} City Market Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnglishFooter;
