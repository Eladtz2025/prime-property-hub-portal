import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ExternalLink, X, Undo2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScoutedPropertyCardProps {
  match: {
    id: string;
    title: string | null;
    city: string | null;
    price: number | null;
    rooms: number | null;
    size: number | null;
    source: string;
    source_url: string;
    is_private: boolean | null;
    matchScore: number;
    matchReasons: string[];
    address: string | null;
    neighborhood: string | null;
    propertyType: string | null;
    isDismissed?: boolean;
  };
  customerName: string;
  customerPhone?: string | null;
  onDismiss: (propertyId: string) => void;
  onRestore?: (propertyId: string) => void;
  onSendWhatsApp: (property: { title: string | null; city: string | null; price: number | null; rooms: number | null; size: number | null; source_url: string }) => void;
  isLoading?: boolean;
}

export const ScoutedPropertyCard = ({
  match,
  customerName,
  customerPhone,
  onDismiss,
  onRestore,
  onSendWhatsApp,
  isLoading,
}: ScoutedPropertyCardProps) => {
  const isDismissed = match.isDismissed;

  return (
    <div 
      className={`p-3 border rounded-lg transition-colors relative ${
        isDismissed 
          ? 'bg-muted/50 opacity-60' 
          : 'bg-primary/5 hover:bg-primary/10'
      }`}
    >
      {/* Dismiss/Restore button */}
      {isDismissed ? (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-1 left-1 h-6 w-6 p-0 text-primary hover:text-primary hover:bg-primary/20"
          onClick={() => onRestore?.(match.id)}
          disabled={isLoading}
          title="שחזר נכס"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-1 left-1 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              title="הסתר נכס"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>הסתרת נכס</AlertDialogTitle>
              <AlertDialogDescription>
                להסתיר את הנכס הזה מהתוצאות של {customerName}? הנכס לא יופיע יותר גם אחרי התאמה מחדש.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction 
                onClick={() => onDismiss(match.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                הסתר
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="flex items-center gap-1 flex-wrap mb-1 pr-6">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {match.source}
        </Badge>
        {match.is_private === true && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">פרטי</Badge>
        )}
        {match.is_private === false && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">תיווך</Badge>
        )}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-auto bg-primary/20 text-primary">
          {match.matchScore}%
        </Badge>
      </div>
      
      <p className="font-medium truncate text-sm">
        {match.propertyType === 'rent' ? 'להשכרה' : 'למכירה'}
        {match.address ? ` ב${match.address.split(',')[0]?.trim()}` : ''}
        {match.neighborhood ? `, ${match.neighborhood}` : ''}
      </p>
      <p className="text-xs text-muted-foreground">
        {match.city && <span>{match.city}</span>}
        {match.rooms && <span> | {match.rooms} חד'</span>}
        {match.size && <span> | {match.size} מ"ר</span>}
      </p>
      <p className="text-sm font-semibold text-primary mt-1">
        {match.price ? `₪${match.price.toLocaleString()}` : 'מחיר לא צוין'}
      </p>
      
      {/* Match Reasons */}
      {match.matchReasons && match.matchReasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {match.matchReasons.slice(0, 4).map((reason, idx) => {
            const isRequired = reason.includes('(חובה)');
            const displayText = reason.replace(' (חובה)', '').replace(' ✓', '');
            return (
              <span 
                key={idx} 
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isRequired 
                    ? 'bg-primary/20 text-primary font-medium' 
                    : 'bg-muted'
                }`}
              >
                {isRequired ? '⭐' : '✓'} {displayText}
              </span>
            );
          })}
        </div>
      )}
      
      {!isDismissed && (
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={() => window.open(match.source_url, '_blank')}
          >
            <ExternalLink className="h-3 w-3 ml-1" />
            צפה
          </Button>
          {customerPhone && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs px-2"
              onClick={() => onSendWhatsApp(match)}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface OwnPropertyCardProps {
  match: {
    id: string;
    title: string | null;
    address: string;
    city: string;
    neighborhood: string | null;
    monthly_rent: number | null;
    rooms: number | null;
    property_size: number | null;
    isDismissed?: boolean;
  };
  customerName: string;
  customerPhone?: string | null;
  onDismiss: (propertyId: string) => void;
  onRestore?: (propertyId: string) => void;
  onSendWhatsApp: (property: { title: string | null; address: string; city: string; rooms: number | null; property_size: number | null; monthly_rent: number | null }) => void;
  isLoading?: boolean;
}

export const OwnPropertyCard = ({
  match,
  customerName,
  customerPhone,
  onDismiss,
  onRestore,
  onSendWhatsApp,
  isLoading,
}: OwnPropertyCardProps) => {
  const isDismissed = match.isDismissed;

  return (
    <div 
      className={`p-3 border rounded-lg transition-colors relative ${
        isDismissed 
          ? 'bg-muted/50 opacity-60' 
          : 'bg-accent/20 hover:bg-accent/30'
      }`}
    >
      {/* Dismiss/Restore button */}
      {isDismissed ? (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-1 left-1 h-6 w-6 p-0 text-primary hover:text-primary hover:bg-primary/20"
          onClick={() => onRestore?.(match.id)}
          disabled={isLoading}
          title="שחזר נכס"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-1 left-1 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              title="הסתר נכס"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>הסתרת נכס</AlertDialogTitle>
              <AlertDialogDescription>
                להסתיר את הנכס הזה מהתוצאות של {customerName}? הנכס לא יופיע יותר גם אחרי התאמה מחדש.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction 
                onClick={() => onDismiss(match.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                הסתר
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-medium truncate text-sm">{match.title || match.address}</p>
          <p className="text-xs text-muted-foreground">
            {match.city && <span>{match.city}</span>}
            {match.neighborhood && <span> - {match.neighborhood}</span>}
            {match.rooms && <span> | {match.rooms} חד'</span>}
            {match.property_size && <span> | {match.property_size} מ"ר</span>}
          </p>
          <p className="text-sm font-semibold text-primary mt-1">
            {match.monthly_rent ? `₪${match.monthly_rent.toLocaleString()}` : ''}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">שלנו</Badge>
      </div>
      
      {!isDismissed && (
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={() => window.open(`/admin-dashboard?property=${match.id}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 ml-1" />
            צפה
          </Button>
          {customerPhone && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs px-2"
              onClick={() => onSendWhatsApp(match)}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
