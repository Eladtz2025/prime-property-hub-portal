import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const EnglishFooter = () => {
  const navigate = useNavigate();
  const currentYear = 2016;

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="font-playfair text-2xl font-normal mb-4 tracking-wide">
              CITY MARKET <span>Properties</span>
            </h3>
            <p className="font-montserrat text-sm text-background/70 mb-4">
              Experts in real estate brokerage, rentals, sales and property management in Tel Aviv.
              15+ years of experience in the Israeli real estate market.
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

          {/* Quick Links */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              Quick Links
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en')}
              >
                Home
              </p>
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
                onClick={() => navigate('/en/neighborhoods')}
              >
                Neighborhoods
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/management')}
              >
                Property Management
              </p>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              Company
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/about')}
              >
                About Us
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/contact')}
              >
                Contact
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              Contact
            </h4>
            <ul className="space-y-3 font-montserrat text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:0545503055" className="hover:text-background transition-colors">
                  054-550-3055
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@citymarket.co.il" className="hover:text-background transition-colors">
                  info@citymarket.co.il
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Tel Aviv, Israel</span>
              </li>
              <li>
                <Link to="/admin-dashboard" className="hover:text-background transition-colors">
                  Management
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center">
          <p className="font-montserrat text-sm text-background/70">
            © {currentYear} City Market Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnglishFooter;
