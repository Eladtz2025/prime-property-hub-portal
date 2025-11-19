import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, Calendar, MapPin, Building2, Coins, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Customer } from "@/hooks/useCustomerData";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  active: 'bg-green-500',
  viewing_scheduled: 'bg-purple-500',
  offer_made: 'bg-orange-500',
  closed_won: 'bg-emerald-500',
  closed_lost: 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  active: 'פעיל',
  viewing_scheduled: 'צפייה קבועה',
  offer_made: 'הצעה בוצעה',
  closed_won: 'נסגר בהצלחה',
  closed_lost: 'נסגר ללא הצלחה',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף',
};

export const CustomerCard = ({ customer, onEdit, onUpdateStatus, onUpdatePriority }: CustomerCardProps) => {
  const handleWhatsApp = () => {
    if (customer.phone) {
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleEmail = () => {
    window.location.href = `mailto:${customer.email}`;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            <Badge className={statusColors[customer.status]}>
              {statusLabels[customer.status]}
            </Badge>
            <Badge className={priorityColors[customer.priority]}>
              {priorityLabels[customer.priority]}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>נוצר: {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: he })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {customer.phone && (
            <>
              <Button size="sm" variant="outline" onClick={handleCall}>
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleWhatsApp}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleEmail}>
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {customer.message && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm">{customer.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {customer.budget_min && customer.budget_max && (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span>תקציב: ₪{customer.budget_min.toLocaleString()} - ₪{customer.budget_max.toLocaleString()}</span>
          </div>
        )}
        
        {customer.rooms_min && customer.rooms_max && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>חדרים: {customer.rooms_min} - {customer.rooms_max}</span>
          </div>
        )}

        {customer.preferred_cities && customer.preferred_cities.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>ערים: {customer.preferred_cities.join(', ')}</span>
          </div>
        )}

        {customer.move_in_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>כניסה: {format(new Date(customer.move_in_date), 'dd/MM/yyyy', { locale: he })}</span>
          </div>
        )}
      </div>

      {customer.notes && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium mb-1">הערות:</p>
          <p className="text-sm">{customer.notes}</p>
        </div>
      )}

      {customer.next_followup_date && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">מעקב הבא:</span>
            <span>{format(new Date(customer.next_followup_date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onEdit(customer)}>
          ערוך פרטים
        </Button>
      </div>
    </Card>
  );
};
