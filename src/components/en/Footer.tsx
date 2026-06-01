import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const EnglishFooter = () => {
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
              <Link to="/en/sales" className="block hover:text-background transition-colors">Buy</Link>
              <Link to="/en/rentals" className="block hover:text-background transition-colors">Rent</Link>
              <Link to="/en/management" className="block hover:text-background transition-colors">Property Management</Link>
              <Link to="/en/new-developments" className="block hover:text-background transition-colors">New Developments</Link>
              <Link to="/en/insights" className="block hover:text-background transition-colors">Insights</Link>
            </div>
          </div>

          {/* Areas */}
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4 font-semibold">
              Areas
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <Link to="/en/neighborhoods/neve-tzedek" className="block hover:text-background transition-colors">Neve Tzedek</Link>
              <Link to="/en/neighborhoods/rothschild" className="block hover:text-background transition-colors">Rothschild</Link>
              <Link to="/en/neighborhoods/florentin" className="block hover:text-background transition-colors">Florentin</Link>
              <Link to="/en/neighborhoods/old-north" className="block hover:text-background transition-colors">Old North</Link>
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
                <a href="tel:+972545503055" className="hover:text-background transition-colors">
                  054-550-3055
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
            <Link to="/en" className="hover:text-background transition-colors">Home</Link>
            <span className="text-background/30">|</span>
            <Link to="/en/about" className="hover:text-background transition-colors">About</Link>
            <span className="text-background/30">|</span>
            <Link to="/en/contact" className="hover:text-background transition-colors">Contact</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="font-montserrat text-xs text-background/50">
            © {currentYear} City Market Properties. All rights reserved.{" "}
            <span
              onClick={() => navigate('/en/sitemap')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/en/sitemap'); }}
              className="underline hover:text-background transition-colors cursor-pointer"
            >
              Sitemap
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnglishFooter;
