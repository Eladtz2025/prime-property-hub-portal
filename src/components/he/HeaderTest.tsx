import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook } from "lucide-react";

const HeaderTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const leftNavItems = [
    { label: "שכונות", path: "/he/neighborhoods" },
    { label: "קצת עלינו", path: "/he/about" },
    { label: "צור קשר", path: "/he/contact" },
  ];

  const rightNavItems = [
    { label: "דף הבית", path: "/he" },
    { label: "ניהול נכסים", path: "/he/management" },
    { label: "בניינים חדשים", path: "/he/new-developments" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const textColor = 'hsl(var(--foreground))';
  const activeColor = 'hsl(var(--primary))';
  const mutedColor = 'hsl(var(--foreground))';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-md" dir="rtl">
      <div className="container mx-auto px-4 relative h-full">
        <div className="grid grid-cols-3 items-center h-full">
          {/* Right Navigation (RTL) with Facebook icon */}
          <nav className="hidden lg:flex items-center gap-6 justify-end">
            <a
              href="https://www.facebook.com/Ctmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80 ml-2"
              style={{ color: mutedColor }}
            >
              <Facebook className="w-5 h-5" />
            </a>
            
            {rightNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative font-montserrat text-sm tracking-[0.15em] uppercase font-normal transition-all duration-300"
                style={{
                  color: isActive(item.path) ? activeColor : mutedColor,
                }}
              >
                <span style={{ position: 'relative' }}>
                  {item.label}
                  <span 
                    className="absolute w-full h-0.5 bottom-0 right-0 origin-right transition-transform duration-300"
                    style={{
                      backgroundColor: activeColor,
                      transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                    }}
                  />
                </span>
              </button>
            ))}
          </nav>

          {/* Center Logo - Grayscale */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/he")}
              className="transition-transform duration-200 hover:scale-105"
            >
              <img 
                src="/images/city-market-icon.png" 
                alt="City Market" 
                className="h-10 md:h-12 w-auto translate-y-1"
                style={{ filter: 'grayscale(100%)' }}
              />
            </button>
          </div>

          {/* Left Navigation (RTL) with Instagram icon */}
          <nav className="hidden lg:flex items-center gap-6 justify-start">
            {leftNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative font-montserrat text-sm tracking-[0.15em] uppercase font-normal transition-all duration-300"
                style={{
                  color: isActive(item.path) ? activeColor : mutedColor,
                }}
              >
                <span style={{ position: 'relative' }}>
                  {item.label}
                  <span 
                    className="absolute w-full h-0.5 bottom-0 right-0 origin-right transition-transform duration-300"
                    style={{
                      backgroundColor: activeColor,
                      transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                    }}
                  />
                </span>
              </button>
            ))}
            
            <a
              href="https://www.instagram.com/citymarket/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80 mr-2"
              style={{ color: mutedColor }}
            >
              <Instagram className="w-5 h-5" />
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" style={{ color: textColor }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: textColor }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-border" dir="rtl">
            <div className="flex flex-col gap-2 py-4 px-4">
              {[...rightNavItems, ...leftNavItems].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-sm tracking-[0.15em] uppercase text-right py-3 px-2 rounded-md transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-foreground hover:text-primary hover:bg-accent font-normal"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-border">
                <a
                  href="https://www.facebook.com/Ctmarket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="https://www.instagram.com/citymarket/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default HeaderTest;
