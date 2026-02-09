import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Building2, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectUnitsTableProps {
  propertyId: string;
  trackingUrl: string;
}

export const ProjectUnitsTable: React.FC<ProjectUnitsTableProps> = ({ propertyId, trackingUrl }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['project-units', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('property_id', propertyId)
        .order('floor', { ascending: true })
        .order('rooms', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: lastScan } = useQuery({
    queryKey: ['project-scan-log', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_scan_logs')
        .select('*')
        .eq('property_id', propertyId)
        .order('scanned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scout-project', {
        body: { property_id: propertyId },
      });

      if (error) throw error;

      toast({
        title: 'סריקה הושלמה',
        description: `נמצאו ${data?.summary?.totalFound || 0} יחידות, ${data?.summary?.totalAdded || 0} חדשות, ${data?.summary?.totalRemoved || 0} נמכרו`,
      });

      queryClient.invalidateQueries({ queryKey: ['project-units', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['project-scan-log', propertyId] });
    } catch (error: any) {
      toast({
        title: 'שגיאה בסריקה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const filteredUnits = units.filter((u: any) => 
    statusFilter === 'all' || u.status === statusFilter
  );

  const availableCount = units.filter((u: any) => u.status === 'available').length;
  const soldCount = units.filter((u: any) => u.status === 'sold').length;
  const reservedCount = units.filter((u: any) => u.status === 'reserved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">זמין</Badge>;
      case 'sold':
        return <Badge variant="destructive">נמכר</Badge>;
      case 'reserved':
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">שמור</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return `₪${price.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  const getPriceChange = (unit: any) => {
    const history = unit.price_history || [];
    if (history.length < 2) return null;
    const prev = history[history.length - 2].price;
    const curr = history[history.length - 1].price;
    const diff = curr - prev;
    return diff;
  };

  return (
    <div className="space-y-4 mt-4 border rounded-lg p-4 bg-background/50" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">יחידות בפרויקט</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stats */}
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="text-green-600 border-green-300">
              {availableCount} זמינות
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-300">
              {soldCount} נמכרו
            </Badge>
            {reservedCount > 0 && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {reservedCount} שמורות
              </Badge>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="available">זמין</SelectItem>
              <SelectItem value="sold">נמכר</SelectItem>
              <SelectItem value="reserved">שמור</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={handleScanNow}
            disabled={isScanning}
            className="h-7 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ml-1 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'סורק...' : 'סרוק עכשיו'}
          </Button>
        </div>
      </div>

      {/* Last scan info */}
      {lastScan && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>סריקה אחרונה: {formatDate(lastScan.scanned_at)}</span>
          {lastScan.status === 'failed' && (
            <Badge variant="destructive" className="text-[10px] h-4">נכשל</Badge>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">טוען יחידות...</div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {units.length === 0 
            ? 'לא נמצאו יחידות עדיין. לחץ "סרוק עכשיו" כדי להתחיל.'
            : 'אין יחידות בסינון הנוכחי'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">סוג</TableHead>
                <TableHead className="text-xs">חדרים</TableHead>
                <TableHead className="text-xs">שטח</TableHead>
                <TableHead className="text-xs">קומה</TableHead>
                <TableHead className="text-xs">מחיר</TableHead>
                <TableHead className="text-xs">סטטוס</TableHead>
                <TableHead className="text-xs">נראה לאחרונה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit: any) => {
                const priceChange = getPriceChange(unit);
                return (
                  <TableRow key={unit.id} className={unit.status === 'sold' ? 'opacity-60' : ''}>
                    <TableCell className="text-xs">{unit.unit_type || 'דירה'}</TableCell>
                    <TableCell className="text-xs">{unit.rooms || '—'}</TableCell>
                    <TableCell className="text-xs">{unit.size ? `${unit.size} מ"ר` : '—'}</TableCell>
                    <TableCell className="text-xs">{unit.floor ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        {formatPrice(unit.price)}
                        {priceChange !== null && priceChange !== 0 && (
                          <span className={`flex items-center text-[10px] ${priceChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(unit.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(unit.last_seen_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tracking URL */}
      <div className="text-xs text-muted-foreground truncate pt-2 border-t">
        🔗 <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{trackingUrl}</a>
      </div>
    </div>
  );
};
