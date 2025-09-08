import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Edit,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  is_active: boolean;
  property_id: string;
}

interface TenantCardProps {
  tenant: Tenant;
  propertyAddress: string;
  onEditTenant: (tenant: Tenant) => void;
  onManageTenant: (tenant: Tenant) => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  propertyAddress,
  onEditTenant,
  onManageTenant
}) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'לא צוין';
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const isLeaseExpiringSoon = () => {
    if (!tenant.lease_end_date) return false;
    const endDate = new Date(tenant.lease_end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLeaseExpired = () => {
    if (!tenant.lease_end_date) return false;
    const endDate = new Date(tenant.lease_end_date);
    const today = new Date();
    return endDate < today;
  };

  return (
    <Card className="relative">
      {/* Status indicators */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Badge variant={tenant.is_active ? "default" : "secondary"}>
          {tenant.is_active ? 'פעיל' : 'לא פעיל'}
        </Badge>
        {isLeaseExpired() && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            פג תוקף
          </Badge>
        )}
        {isLeaseExpiringSoon() && !isLeaseExpired() && (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            פג בקרוב
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-right flex items-center gap-2">
          <User className="w-5 h-5" />
          {tenant.name}
        </CardTitle>
        <div className="text-sm text-muted-foreground text-right">
          {propertyAddress}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          {tenant.phone && (
            <div className="flex items-center gap-2 justify-end text-sm">
              <span>{tenant.phone}</span>
              <Phone className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          {tenant.email && (
            <div className="flex items-center gap-2 justify-end text-sm">
              <span className="truncate">{tenant.email}</span>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-right">
            <div className="text-muted-foreground">שכר דירה</div>
            <div className="font-medium text-green-600">
              {formatCurrency(tenant.monthly_rent)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">פיקדון</div>
            <div className="font-medium">
              {formatCurrency(tenant.deposit_amount)}
            </div>
          </div>
        </div>

        {/* Lease Dates */}
        {(tenant.lease_start_date || tenant.lease_end_date) && (
          <div className="space-y-2 text-sm">
            {tenant.lease_start_date && (
              <div className="flex items-center gap-2 justify-end">
                <span>
                  {format(new Date(tenant.lease_start_date), "dd/MM/yyyy", { locale: he })}
                </span>
                <span className="text-muted-foreground">מתחילת חכירה:</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            {tenant.lease_end_date && (
              <div className="flex items-center gap-2 justify-end">
                <span className={isLeaseExpired() ? 'text-red-600 font-medium' : ''}>
                  {format(new Date(tenant.lease_end_date), "dd/MM/yyyy", { locale: he })}
                </span>
                <span className="text-muted-foreground">עד סיום חכירה:</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEditTenant(tenant)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            עריכה
          </Button>
          <Button 
            size="sm" 
            onClick={() => onManageTenant(tenant)}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            ניהול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};