import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ContactSection = () => {
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">צור קשר</h2>
          <p className="text-lg text-muted-foreground">
            נשמח לעמוד לשירותכם בכל שאלה
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">טלפון</h3>
            <a href="tel:0545503055" className="text-muted-foreground hover:text-primary transition-colors">
              054-550-3055
            </a>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">אימייל</h3>
            <a href="mailto:info@citymarket.co.il" className="text-muted-foreground hover:text-primary transition-colors break-all">
              info@citymarket.co.il
            </a>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">כתובת</h3>
            <p className="text-muted-foreground">
              תל אביב, ישראל
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">שעות פעילות</h3>
            <p className="text-muted-foreground">
              24/7<br />זמינים תמיד
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;