import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const HebrewHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rightNavItems = [
    { label: "דף הבית", path: "/" },
    { label: "ניהול נכסים", path: "/management" },
    { label: "פרויקטים חדשים", path: "/new-developments" },
  ];

  const leftNavItems = [
    { label: "שכונות", path: "/neighborhoods" },
    { label: "אודות", path: "/about" },
    { label: "צור קשר", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Right Navigation (RTL) */}
          <nav className="hidden lg:flex items-center gap-6">
            {rightNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative font-montserrat text-sm tracking-wide uppercase font-semibold transition-all duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]
                  after:content-[''] after:absolute after:w-full after:h-0.5 after:bottom-0 after:left-0 after:bg-white after:origin-right after:transition-transform after:duration-300
                  ${
                  isActive(item.path)
                    ? "text-white after:scale-x-100"
                    : "text-white/90 hover:text-white after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Center Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
          >
            <span className="font-playfair text-2xl md:text-3xl font-normal tracking-widest uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              CITY MARKET
            </span>
            <img 
              src="/images/city-market-icon.png" 
              alt="City Market" 
              className="h-14 md:h-16 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] translate-y-1"
            />
          </button>

          {/* Left Navigation (RTL) */}
          <nav className="hidden lg:flex items-center gap-6">
            {leftNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative font-montserrat text-sm tracking-wide uppercase font-semibold transition-all duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]
                  after:content-[''] after:absolute after:w-full after:h-0.5 after:bottom-0 after:left-0 after:bg-white after:origin-left after:transition-transform after:duration-300
                  ${
                  isActive(item.path)
                    ? "text-white after:scale-x-100"
                    : "text-white/90 hover:text-white after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/en")}
              className="font-montserrat text-sm tracking-wide text-white/90 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            >
              English
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              ) : (
                <Menu className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 bg-background/95 backdrop-blur-sm rounded-lg mt-2">
            <div className="flex flex-col gap-4 px-4">
              {[...rightNavItems, ...leftNavItems].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-sm tracking-wide uppercase text-right py-2 transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-primary font-medium"
                      : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default HebrewHeader;
