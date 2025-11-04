import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-luxury text-luxury-foreground mt-16">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">City Market Properties</h3>
            <p className="text-sm text-luxury-foreground/80 mb-3 md:mb-4 leading-relaxed">
              מומחים בתיווך נדל"ן בתל אביב. 15+ שנות ניסיון.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/citymarket/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/Ctmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/rentals" className="text-sm text-luxury-foreground/80 hover:text-secondary transition-colors">
                  השכרות
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-sm text-luxury-foreground/80 hover:text-secondary transition-colors">
                  מכירות
                </Link>
              </li>
              <li>
                <Link to="/management" className="text-sm text-luxury-foreground/80 hover:text-secondary transition-colors">
                  ניהול נכסים
                </Link>
              </li>
              <li>
                <Link to="/admin-dashboard" className="text-sm text-luxury-foreground/80 hover:text-secondary transition-colors">
                  עמוד מנהלים
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">צור קשר</h3>
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-center gap-2 text-sm text-luxury-foreground/80">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:0545503055" className="hover:text-secondary transition-colors">
                  054-550-3055
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-luxury-foreground/80">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@citymarket.co.il" className="hover:text-secondary transition-colors break-all">
                  info@citymarket.co.il
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-luxury-foreground/80">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>תל אביב, ישראל</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-luxury-foreground/20 mt-6 md:mt-8 pt-6 md:pt-8">
          <p className="text-sm text-luxury-foreground/60 text-center">
            © {currentYear} City Market Properties. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;