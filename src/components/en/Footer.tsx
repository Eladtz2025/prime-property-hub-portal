import { useNavigate } from "react-router-dom";

const EnglishFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="font-playfair text-2xl font-normal mb-4 tracking-wide">
              CITY MARKET
            </h3>
            <p className="font-montserrat text-sm text-background/70">
              Real Estate
            </p>
          </div>
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
            </div>
          </div>
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
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/en/management')}
              >
                Property Management
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              Contact
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p>Tel Aviv, Israel</p>
              <p>info@citymarket.co.il</p>
              <p>+972-XX-XXXXXXX</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center">
          <p className="font-montserrat text-sm text-background/70">
            © 2024 City Market Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnglishFooter;
