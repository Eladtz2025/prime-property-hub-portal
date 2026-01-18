import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Phone, Mail, MessageSquare, Calendar, MapPin, Building2, Coins, Clock, ChevronDown, ChevronUp, User, Dog, Car, Home, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Customer } from "@/hooks/useCustomerData";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onAssignAgent?: (id: string, agentId: string | null) => void;
  onScheduleFollowup?: (id: string, date: string) => void;
  agents?: Agent[];
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500 text-white',
  contacted: 'bg-yellow-500 text-black',
  active: 'bg-green-500 text-white',
  viewing_scheduled: 'bg-purple-500 text-white',
  offer_made: 'bg-orange-500 text-white',
  closed_won: 'bg-emerald-600 text-white',
  closed_lost: 'bg-gray-500 text-white',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
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

const getTimeSinceContact = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff === 1) return { text: 'אתמול', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 3) return { text: `לפני ${daysDiff} ימים`, color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 7) return { text: `לפני ${daysDiff} ימים`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (daysDiff <= 14) return { text: `לפני ${daysDiff} ימים`, color: 'text-orange-600', bg: 'bg-orange-100' };
  return { text: `לפני ${daysDiff} ימים`, color: 'text-red-600', bg: 'bg-red-100' };
};

export const CustomerCard = ({ 
  customer, 
  onEdit, 
  onUpdateStatus, 
  onUpdatePriority,
  onAssignAgent,
  onScheduleFollowup,
  agents = []
}: CustomerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeSince = getTimeSinceContact(customer.last_contact_date, customer.created_at);

  const handleWhatsApp = () => {
    if (customer.phone) {
      const message = encodeURIComponent(
        `שלום ${customer.name}, אני מ-City Market נדל"ן.\n` +
        (customer.preferred_cities?.length ? `ראיתי שאתה מחפש דירה ב${customer.preferred_cities[0]}` : 'ראיתי שאתה מחפש דירה') +
        (customer.rooms_min ? ` עם ${customer.rooms_min}${customer.rooms_max ? `-${customer.rooms_max}` : ''} חדרים` : '') +
        `.\nיש לי כמה נכסים שיכולים להתאים לך, מתי נוח לדבר?`
      );
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleQuickFollowup = () => {
    if (onScheduleFollowup) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      onScheduleFollowup(customer.id, tomorrow.toISOString());
    }
  };

  const assignedAgent = agents.find(a => a.id === customer.assigned_agent_id);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Compact Header - Always Visible */}
      <div className="space-y-3">
        {/* Row 1: Name + Badges */}
        <div className="flex flex-row-reverse items-center justify-between gap-2">
          <div className="flex flex-row-reverse items-center gap-2 flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate">{customer.name}</h3>
            <Badge className={`${statusColors[customer.status]} text-xs shrink-0`}>
              {statusLabels[customer.status]}
            </Badge>
            <Badge className={`${priorityColors[customer.priority]} text-xs shrink-0`}>
              {priorityLabels[customer.priority]}
            </Badge>
          </div>
        </div>

        {/* Row 2: Contact Info + Time Indicator */}
        <div className="flex flex-row-reverse items-center gap-3 text-sm text-muted-foreground flex-wrap">
          {customer.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${timeSince.bg} ${timeSince.color}`}>
            <Clock className="h-3 w-3" />
            {timeSince.text}
          </span>
        </div>

        {/* Row 3: Preferences Summary */}
        <div className="flex flex-row-reverse items-center gap-3 text-sm text-muted-foreground flex-wrap">
          {(customer.budget_min || customer.budget_max) && (
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {customer.budget_min && customer.budget_max 
                ? `₪${(customer.budget_min/1000).toFixed(0)}-${(customer.budget_max/1000).toFixed(0)}K`
                : customer.budget_max 
                  ? `עד ₪${(customer.budget_max/1000).toFixed(0)}K`
                  : `מ-₪${(customer.budget_min!/1000).toFixed(0)}K`
              }
            </span>
          )}
          {(customer.rooms_min || customer.rooms_max) && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {customer.rooms_min && customer.rooms_max 
                ? `${customer.rooms_min}-${customer.rooms_max} חדרים`
                : customer.rooms_max 
                  ? `עד ${customer.rooms_max} חדרים`
                  : `${customer.rooms_min}+ חדרים`
              }
            </span>
          )}
          {customer.preferred_cities && customer.preferred_cities.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {customer.preferred_cities.slice(0, 2).join(', ')}
              {customer.preferred_cities.length > 2 && `+${customer.preferred_cities.length - 2}`}
            </span>
          )}
          {/* Property type indicator */}
          {customer.property_type && (
            <span className="flex items-center gap-1">
              {customer.property_type === 'rental' && <Home className="h-3 w-3" />}
              {customer.property_type === 'sale' && <Briefcase className="h-3 w-3" />}
              {customer.property_type === 'rental' ? 'שכירות' : customer.property_type === 'sale' ? 'מכירה' : 'שניהם'}
            </span>
          )}
          {/* Quick icons for rental requirements */}
          {customer.pets && <span title="יש חיות מחמד"><Dog className="h-3 w-3 text-amber-600" /></span>}
          {customer.parking_required && <span title="דורש חניה"><Car className="h-3 w-3 text-blue-600" /></span>}
        </div>

        {/* Row 4: Assigned Agent */}
        {assignedAgent && (
          <div className="flex flex-row-reverse items-center gap-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">סוכן:</span>
            <span className="font-medium">{assignedAgent.full_name || assignedAgent.email}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-row-reverse items-center gap-2 pt-2 border-t">
          {/* Status Dropdown */}
          <Select 
            value={customer.status} 
            onValueChange={(value) => onUpdateStatus(customer.id, value)}
          >
            <SelectTrigger className="h-8 text-xs w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">חדש</SelectItem>
              <SelectItem value="contacted">נוצר קשר</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="viewing_scheduled">צפייה קבועה</SelectItem>
              <SelectItem value="offer_made">הצעה בוצעה</SelectItem>
              <SelectItem value="closed_won">נסגר בהצלחה</SelectItem>
              <SelectItem value="closed_lost">נסגר ללא הצלחה</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Dropdown */}
          <Select 
            value={customer.priority} 
            onValueChange={(value) => onUpdatePriority(customer.id, value)}
          >
            <SelectTrigger className="h-8 text-xs w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">נמוך</SelectItem>
              <SelectItem value="medium">בינוני</SelectItem>
              <SelectItem value="high">גבוה</SelectItem>
              <SelectItem value="urgent">דחוף</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Followup */}
          {onScheduleFollowup && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs"
              onClick={handleQuickFollowup}
            >
              <Calendar className="h-3 w-3 ml-1" />
              מעקב מחר
            </Button>
          )}

          {/* Communication Buttons */}
          <div className="flex gap-1 mr-auto">
            {customer.phone && (
              <>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={handleWhatsApp}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Expand Button */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 text-xs">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                פרטים
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Expanded Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="pt-4 space-y-4">
          {/* Agent Assignment */}
          {onAssignAgent && agents.length > 0 && (
            <div className="flex flex-row-reverse items-center gap-2">
              <Label className="text-sm font-medium">סוכן מטפל:</Label>
              <Select 
                value={customer.assigned_agent_id || "none"} 
                onValueChange={(value) => onAssignAgent(customer.id, value === "none" ? null : value)}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="בחר סוכן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא סוכן</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          {customer.message && (
            <div className="p-3 bg-muted rounded-md text-right">
              <p className="text-sm font-medium mb-1">הודעה:</p>
              <p className="text-sm text-muted-foreground">{customer.message}</p>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-right">
              <p className="text-sm font-medium mb-1">הערות:</p>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}


          {/* Full Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">תאריך יצירה:</span>
              <span className="mr-2">{format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: he })}</span>
            </div>
            {customer.move_in_date && (
              <div className="text-right">
                <span className="text-muted-foreground">תאריך כניסה:</span>
                <span className="mr-2">{format(new Date(customer.move_in_date), 'dd/MM/yyyy', { locale: he })}</span>
              </div>
            )}
            {customer.preferred_neighborhoods && customer.preferred_neighborhoods.length > 0 && (
              <div className="col-span-2 text-right">
                <span className="text-muted-foreground">שכונות:</span>
                <span className="mr-2">{customer.preferred_neighborhoods.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => onEdit(customer)}>
              ערוך פרטים מלאים
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
