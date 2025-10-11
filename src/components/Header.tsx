import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/city-market-logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/rentals', label: 'השכרות' },
    { path: '/sales', label: 'מכירות' },
    { path: '/management', label: 'ניהול נכסים' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button - Left on Mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="p-1.5 touch-target"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="תפריט"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Desktop Logo - Left on Desktop */}
          <Link to="/" className="hidden md:flex items-center gap-2 md:gap-3">
            <img 
              src={logoImage} 
              alt="City Market Properties" 
              className="h-14 w-auto lg:h-16"
            />
            <span className="text-xl md:text-2xl font-bold text-foreground hidden sm:inline">City Market Properties</span>
          </Link>

          {/* Desktop Navigation - Absolutely Centered */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-lg font-bold transition-colors hover:text-primary ${
                  isActive(link.path) ? 'text-primary' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side - Logo (Mobile) + Social Media */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Logo - Right on Mobile */}
            <Link to="/" className="md:hidden flex items-center">
              <img 
                src={logoImage} 
                alt="City Market Properties" 
                className="h-14 w-auto"
              />
            </Link>

            {/* Social Media - Always Visible */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                className="p-1.5 md:p-2"
                asChild
              >
                <a
                  href="https://www.instagram.com/citymarket/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 md:h-5 md:w-5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                className="p-1.5 md:p-2"
                asChild
              >
                <a
                  href="https://www.facebook.com/Ctmarket"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 md:h-5 md:w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t animate-fade-in text-center">
            <nav className="flex flex-col gap-3 sm:gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base sm:text-lg font-bold transition-colors hover:text-primary text-center touch-target ${
                    isActive(link.path) ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;