import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { 
  User, 
  Home, 
  Phone, 
  MessageSquare, 
  UserCheck, 
  Search,
  Download,
  Edit,
  Plus,
  Trash2,
  LogIn,
  LogOut
} from "lucide-react";

const getActionIcon = (action: string) => {
  switch (action) {
    case 'login': return <LogIn className="h-4 w-4" />;
    case 'logout': return <LogOut className="h-4 w-4" />;
    case 'property_created': return <Plus className="h-4 w-4" />;
    case 'property_updated': return <Edit className="h-4 w-4" />;
    case 'property_deleted': return <Trash2 className="h-4 w-4" />;
    case 'contact_made': return <Phone className="h-4 w-4" />;
    case 'whatsapp_sent': return <MessageSquare className="h-4 w-4" />;
    case 'user_approved': return <UserCheck className="h-4 w-4" />;
    case 'user_role_changed': return <User className="h-4 w-4" />;
    case 'profile_updated': return <User className="h-4 w-4" />;
    case 'search_performed': return <Search className="h-4 w-4" />;
    case 'export_data': return <Download className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'property_created':
    case 'user_approved':
      return 'default';
    case 'property_updated':
    case 'profile_updated':
      return 'secondary';
    case 'property_deleted':
      return 'destructive';
    case 'contact_made':
    case 'whatsapp_sent':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatActionText = (action: string, resourceType: string, details: any) => {
  switch (action) {
    case 'login': return 'התחברות למערכת';
    case 'logout': return 'יציאה מהמערכת';
    case 'property_created': return 'נוצר נכס חדש';
    case 'property_updated': return 'עודכן נכס';
    case 'property_deleted': return 'נמחק נכס';
    case 'contact_made': return 'בוצעה שיחה';
    case 'whatsapp_sent': return 'נשלחה הודעה בוואטסאפ';
    case 'user_approved': return 'אושר משתמש';
    case 'user_role_changed': return `שונה תפקיד משתמש ל${details?.newRole || 'לא ידוע'}`;
    case 'profile_updated': return 'עודכן פרופיל';
    case 'search_performed': return `חיפוש: "${details?.query || 'נכסים'}"`;
    case 'export_data': return 'יוצאו נתונים';
    case 'bulk_action': return 'פעולת המוני';
    default: return action.replace('_', ' ');
  }
};

const formatResourceType = (resourceType: string) => {
  switch (resourceType) {
    case 'property': return 'נכס';
    case 'user': return 'משתמש';
    case 'contact': return 'קשר';
    case 'search': return 'חיפוש';
    case 'system': return 'מערכת';
    case 'auth': return 'אבטחה';
    default: return resourceType;
  }
};

interface ActivityLogsListProps {
  limit?: number;
}

export const ActivityLogsList: React.FC<ActivityLogsListProps> = ({ limit }) => {
  const { activities, isLoading, error } = useActivityLogs();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit || 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">שגיאה בטעינת הפעילות</p>
      </div>
    );
  }

  return (
    <div>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-sm font-medium">עדיין לא התחלת להשתמש במערכת</p>
          <p className="text-xs mt-1">הפעילות שלך תופיע כאן</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, limit).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 space-x-reverse p-3 border rounded-lg" dir="rtl">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <p className="text-sm font-medium">
                      {formatActionText(activity.action, activity.resource_type, activity.details)}
                    </p>
                    <Badge variant={getActionBadgeVariant(activity.action) as any}>
                      {formatResourceType(activity.resource_type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: he })}
                  </p>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.details.propertyAddress && (
                        <span>• {activity.details.propertyAddress}</span>
                      )}
                      {activity.details.contactResult && (
                        <span>• Result: {activity.details.contactResult}</span>
                      )}
                      {activity.details.query && (
                        <span>• Query: "{activity.details.query}"</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};