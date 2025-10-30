import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HebrewFooter = () => {
  const navigate = useNavigate();
  const currentYear = 2016;

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold tracking-wide text-center">
                CITY MARKET
              </h3>
              <p className="text-xs text-background/70 text-center tracking-widest">
                Properties
              </p>
            </div>
            <p className="text-sm text-background/70 mb-4">
              מומחים בתיווך נדל"ן, השכרה, מכירה וניהול נכסים בתל אביב.
              15+ שנות ניסיון בשוק הנדל"ן הישראלי.
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
            <h4 className="text-sm tracking-widest uppercase mb-4">
              קישורים מהירים
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/')}
              >
                בית
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/sales')}
              >
                מכירות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/rentals')}
              >
                השכרות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/neighborhoods')}
              >
                שכונות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/management')}
              >
                ניהול נכסים
              </p>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">
              החברה
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/about')}
              >
                אודות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/contact')}
              >
                צור קשר
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">
              יצירת קשר
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
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
                <span>תל אביב, ישראל</span>
              </li>
              <li>
                <Link to="/admin-dashboard" className="hover:text-background transition-colors">
                  ניהול
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center">
          <p className="text-sm text-background/70">
            © {currentYear} City Market Properties. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HebrewFooter;
