import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

interface WhatsAppBulkBarProps {
  selectedCount: number;
  onSendClick: () => void;
  onClearSelection: () => void;
  label?: string;
}

export const WhatsAppBulkBar = ({ selectedCount, onSendClick, onClearSelection, label = 'פריטים' }: WhatsAppBulkBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4" dir="rtl">
      <span className="text-sm font-medium whitespace-nowrap">
        נבחרו {selectedCount} {label}
      </span>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white gap-1.5 rounded-full"
        onClick={onSendClick}
      >
        <MessageSquare className="h-4 w-4" />
        שלח WhatsApp
      </Button>
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
