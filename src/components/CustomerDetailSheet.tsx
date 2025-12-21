import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageSquare, Calendar, MapPin, Building2, Coins, Clock, User, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Customer } from "@/hooks/useCustomerData";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerDetailSheetProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
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

export const CustomerDetailSheet = ({
  customer,
  open,
  onClose,
  onEdit,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onScheduleFollowup,
  agents = [],
}: CustomerDetailSheetProps) => {
  if (!customer) return null;

  const timeSince = getTimeSinceContact(customer.last_contact_date, customer.created_at);
  const assignedAgent = agents.find(a => a.id === customer.assigned_agent_id);

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

  const handleEmail = () => {
    window.location.href = `mailto:${customer.email}`;
  };

  const handleQuickFollowup = () => {
    if (onScheduleFollowup) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      onScheduleFollowup(customer.id, tomorrow.toISOString());
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-4 pb-2 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-lg font-bold">{customer.name}</SheetTitle>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <Badge className={`${statusColors[customer.status]} text-xs`}>
              {statusLabels[customer.status]}
            </Badge>
            <Badge className={`${priorityColors[customer.priority]} text-xs`}>
              {priorityLabels[customer.priority]}
            </Badge>
            <span className={`px-2 py-0.5 rounded-full text-xs ${timeSince.bg} ${timeSince.color}`}>
              <Clock className="h-3 w-3 inline ml-1" />
              {timeSince.text}
            </span>
          </div>
        </SheetHeader>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto h-[calc(85vh-140px)] p-4 space-y-4" dir="rtl">
          {/* Contact Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">פרטי קשר</h3>
            <div className="flex flex-col gap-2">
              {customer.phone && (
                <button 
                  onClick={handleCall}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-right"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">{customer.phone}</span>
                </button>
              )}
              <button 
                onClick={handleEmail}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-right"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm truncate">{customer.email}</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          {(customer.budget_min || customer.budget_max || customer.rooms_min || customer.rooms_max || customer.preferred_cities?.length) && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">העדפות</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(customer.budget_min || customer.budget_max) && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customer.budget_min && customer.budget_max 
                          ? `₪${(customer.budget_min/1000).toFixed(0)}-${(customer.budget_max/1000).toFixed(0)}K`
                          : customer.budget_max 
                            ? `עד ₪${(customer.budget_max/1000).toFixed(0)}K`
                            : `מ-₪${(customer.budget_min!/1000).toFixed(0)}K`
                        }
                      </span>
                    </div>
                  )}
                  {(customer.rooms_min || customer.rooms_max) && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customer.rooms_min && customer.rooms_max 
                          ? `${customer.rooms_min}-${customer.rooms_max} חד'`
                          : customer.rooms_max 
                            ? `עד ${customer.rooms_max} חד'`
                            : `${customer.rooms_min}+ חד'`
                        }
                      </span>
                    </div>
                  )}
                  {customer.preferred_cities && customer.preferred_cities.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{customer.preferred_cities.join(', ')}</span>
                    </div>
                  )}
                  {customer.preferred_neighborhoods && customer.preferred_neighborhoods.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">שכונות: {customer.preferred_neighborhoods.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Quick Updates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">עדכון מהיר</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">סטטוס</label>
                <Select 
                  value={customer.status} 
                  onValueChange={(value) => onUpdateStatus(customer.id, value)}
                >
                  <SelectTrigger className="h-9">
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
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">עדיפות</label>
                <Select 
                  value={customer.priority} 
                  onValueChange={(value) => onUpdatePriority(customer.id, value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוך</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="urgent">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {onAssignAgent && agents.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">סוכן מטפל</label>
                <Select 
                  value={customer.assigned_agent_id || "none"} 
                  onValueChange={(value) => onAssignAgent(customer.id, value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-9">
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
          </div>

          <Separator />

          {/* Message & Notes */}
          {(customer.message || customer.notes) && (
            <>
              <div className="space-y-2">
                {customer.message && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">הודעה מהלקוח:</p>
                    <p className="text-sm">{customer.message}</p>
                  </div>
                )}
                {customer.notes && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">הערות:</p>
                    <p className="text-sm">{customer.notes}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Next Followup */}
          {customer.next_followup_date && (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">מעקב הבא:</span>
                  <span>{format(new Date(customer.next_followup_date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Assigned Agent Info */}
          {assignedAgent && (
            <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">סוכן מטפל:</span>
              <span className="font-medium">{assignedAgent.full_name || assignedAgent.email}</span>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>נוצר: {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: he })}</p>
            {customer.move_in_date && (
              <p>תאריך כניסה רצוי: {format(new Date(customer.move_in_date), 'dd/MM/yyyy', { locale: he })}</p>
            )}
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t space-y-3">
          {/* Communication Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {customer.phone && (
              <>
                <Button onClick={handleCall} variant="outline" className="h-10">
                  <Phone className="h-4 w-4 ml-1" />
                  התקשר
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" className="h-10 text-green-600 border-green-600 hover:bg-green-50">
                  <MessageSquare className="h-4 w-4 ml-1" />
                  WhatsApp
                </Button>
              </>
            )}
            {onScheduleFollowup && (
              <Button onClick={handleQuickFollowup} variant="outline" className="h-10">
                <Calendar className="h-4 w-4 ml-1" />
                מעקב מחר
              </Button>
            )}
          </div>
          
          {/* Edit Button */}
          <Button 
            onClick={() => {
              onClose();
              onEdit(customer);
            }} 
            className="w-full h-11"
          >
            ערוך פרטים מלאים
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
