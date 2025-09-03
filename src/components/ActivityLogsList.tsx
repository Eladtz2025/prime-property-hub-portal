import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
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
    case 'login': return 'Logged in';
    case 'logout': return 'Logged out';
    case 'property_created': return 'Created property';
    case 'property_updated': return 'Updated property';
    case 'property_deleted': return 'Deleted property';
    case 'contact_made': return 'Made contact call';
    case 'whatsapp_sent': return 'Sent WhatsApp message';
    case 'user_approved': return 'Approved user';
    case 'user_role_changed': return `Changed user role to ${details?.newRole || 'unknown'}`;
    case 'profile_updated': return 'Updated profile';
    case 'search_performed': return `Searched for "${details?.query || 'properties'}"`;
    case 'export_data': return 'Exported data';
    default: return action.replace('_', ' ');
  }
};

export const ActivityLogsList = () => {
  const { activities, isLoading, error } = useActivityLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load activity logs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {formatActionText(activity.action, activity.resource_type, activity.details)}
                    </p>
                    <Badge variant={getActionBadgeVariant(activity.action) as any}>
                      {activity.resource_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
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
      </CardContent>
    </Card>
  );
};