import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Mail, Phone } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
  const formattedDate = format(new Date(lead.created_at), 'dd/MM HH:mm', { locale: he });

  return (
    <div 
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer active:bg-muted/50 transition-colors"
    >
      {/* Row 1: Name + Date */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-foreground truncate flex-1 ml-2">{lead.name}</h3>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{formattedDate}</span>
      </div>

      {/* Row 2: Contact info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1 truncate">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </span>
        {lead.phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </span>
        )}
      </div>

      {/* Row 3: Message preview */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {lead.message}
      </p>
    </div>
  );
};
