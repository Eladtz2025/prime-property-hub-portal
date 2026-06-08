import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageSquare, EyeOff, Trash2, X, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'new', label: 'חדש', color: 'bg-blue-500' },
  { value: 'contacted', label: 'נוצר קשר', color: 'bg-yellow-500' },
  { value: 'active', label: 'פעיל', color: 'bg-green-500' },
  { value: 'viewing_scheduled', label: 'צפייה קבועה', color: 'bg-purple-500' },
  { value: 'offer_made', label: 'הצעה בוצעה', color: 'bg-orange-500' },
  { value: 'closed_won', label: 'נסגר בהצלחה', color: 'bg-gray-400' },
  { value: 'closed_lost', label: 'לא סגר', color: 'bg-red-400' },
  { value: 'old_needs_check', label: 'ישן - לבדיקה', color: 'bg-amber-500' },
];

interface WhatsAppBulkBarProps {
  selectedCount: number;
  onSendClick: () => void;
  onClearSelection: () => void;
  onHideClick?: () => void;
  onDeleteClick?: () => void;
  onStatusChange?: (status: string) => void;
  label?: string;
  templateCategory?: string;
}

export const WhatsAppBulkBar = ({
  selectedCount,
  onSendClick,
  onClearSelection,
  onHideClick,
  onDeleteClick,
  onStatusChange,
  label = 'פריטים',
}: WhatsAppBulkBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-xl px-4 py-2 flex items-center gap-2 animate-in slide-in-from-bottom-4" dir="rtl">
      <span className="text-sm font-medium whitespace-nowrap pl-1">
        נבחרו {selectedCount} {label}
      </span>
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white gap-1.5 rounded-lg"
        onClick={onSendClick}
      >
        <MessageSquare className="h-4 w-4" />
        WhatsApp
      </Button>
      {onStatusChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
              שנה סטטוס
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" dir="rtl">
            {STATUS_OPTIONS.map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => onStatusChange(opt.value)} className="gap-2">
                <span className={`h-2 w-2 rounded-full ${opt.color} shrink-0`} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onHideClick && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-lg"
          onClick={onHideClick}
        >
          <EyeOff className="h-4 w-4" />
          לא רלוונטי
        </Button>
      )}
      {onDeleteClick && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-lg text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={onDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
          מחק
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 rounded-full"
        onClick={onClearSelection}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
