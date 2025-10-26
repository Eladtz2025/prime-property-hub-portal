import { Link } from "react-router-dom";

const HebrewFooter = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="font-playfair text-2xl font-normal mb-4 tracking-wide">
              סיטי מרקט
            </h3>
            <p className="font-montserrat text-sm text-background/70">
              נכסים ותיווך
            </p>
          </div>
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              קישורים מהירים
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <Link to="/" className="block cursor-pointer hover:text-background transition-colors">
                בית
              </Link>
              <Link to="/sales" className="block cursor-pointer hover:text-background transition-colors">
                קנייה
              </Link>
              <Link to="/rentals" className="block cursor-pointer hover:text-background transition-colors">
                השכרה
              </Link>
              <Link to="/management" className="block cursor-pointer hover:text-background transition-colors">
                ניהול
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              החברה
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p className="cursor-pointer hover:text-background transition-colors">אודות</p>
              <p className="cursor-pointer hover:text-background transition-colors">צור קשר</p>
              <p className="cursor-pointer hover:text-background transition-colors">בלוג</p>
            </div>
          </div>
          <div>
            <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
              יצירת קשר
            </h4>
            <div className="space-y-2 font-montserrat text-sm text-background/70">
              <p>תל אביב, ישראל</p>
              <p>info@citymarket.co.il</p>
              <p>054-550-3055</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center">
          <p className="font-montserrat text-sm text-background/70">
            © 2024 City Market Properties. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HebrewFooter;
