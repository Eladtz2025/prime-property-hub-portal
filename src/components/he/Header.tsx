import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook } from "lucide-react";

const HebrewHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "בית" },
    { path: "/sales", label: "מכירות" },
    { path: "/rentals", label: "השכרות" },
    { path: "/management", label: "ניהול" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Social Icons - Right */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="https://www.instagram.com/citymarket/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-secondary transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/Ctmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-secondary transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>

          {/* Logo - Center */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src="/city-market-logo.png"
              alt="City Market Properties"
              className="h-12 w-auto"
            />
          </Link>

          {/* Navigation - Left (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-montserrat text-sm tracking-wide uppercase transition-colors ${
                  isActive(link.path)
                    ? "text-secondary font-medium"
                    : "text-foreground hover:text-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground hover:text-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-montserrat text-sm tracking-wide uppercase transition-colors ${
                    isActive(link.path)
                      ? "text-secondary font-medium"
                      : "text-foreground hover:text-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <a
                href="https://www.instagram.com/citymarket/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-secondary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/Ctmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-secondary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HebrewHeader;
