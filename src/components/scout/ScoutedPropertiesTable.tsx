import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye, Download, ChevronRight, ChevronLeft, TrendingUp, Calendar, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, startOfDay, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';

interface ScoutedProperty {
  id: string;
  source: string;
  source_url: string;
  title: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  property_type: string | null;
  status: string;
  first_seen_at: string;
  matched_leads: any[];
  features: Record<string, boolean> | null;
  images: string[] | null;
  description: string | null;
  is_active?: boolean;
  is_private?: boolean | null;
}

const PAGE_SIZE = 20;

export const ScoutedPropertiesTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<ScoutedProperty | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<ScoutedProperty | null>(null);

  // Statistics query
  const { data: stats } = useQuery({
    queryKey: ['scouted-properties-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      // Total count
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true });

      // Today count
      const { count: todayCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', today);

      // Today by source
      const { data: todayBySourceData } = await supabase
        .from('scouted_properties')
        .select('source')
        .gte('first_seen_at', today);

      const todayBySources = todayBySourceData?.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // This week count
      const { count: weekCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', weekStart);

      // By source (total)
      const { data: sourceData } = await supabase
        .from('scouted_properties')
        .select('source');

      const sourceCounts = sourceData?.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Last scan results - aggregate all runs from the last batch (within 5 minutes of each other)
      const { data: lastRuns } = await supabase
        .from('scout_runs')
        .select('source, properties_found, new_properties, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20); // Get enough to cover a batch

      let lastScanBySources: Record<string, number> = { yad2: 0, homeless: 0, madlan: 0 };
      
      if (lastRuns && lastRuns.length > 0) {
        // Find the latest completion time
        const latestCompletedAt = new Date(lastRuns[0].completed_at);
        
        // Get all runs that completed within 5 minutes of the latest
        const batchWindowStart = new Date(latestCompletedAt.getTime() - 5 * 60 * 1000);
        
        const batchRuns = lastRuns.filter(run => 
          new Date(run.completed_at) >= batchWindowStart
        );
        
        // Aggregate by source
        lastScanBySources = batchRuns.reduce((acc, run) => {
          const source = run.source || 'other';
          acc[source] = (acc[source] || 0) + (run.properties_found || 0);
          return acc;
        }, { yad2: 0, homeless: 0, madlan: 0 } as Record<string, number>);
      }

      // Inactive count
      const { count: inactiveCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      return {
        total: totalCount || 0,
        today: todayCount || 0,
        todayBySources,
        week: weekCount || 0,
        bySources: sourceCounts,
        lastScanBySources,
        inactive: inactiveCount || 0
      };
    }
  });

  // Total count for pagination
  const { data: totalCount } = useQuery({
    queryKey: ['scouted-properties-count', statusFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { count } = await query;
      return count || 0;
    }
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ['scouted-properties', statusFilter, sourceFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('scouted_properties')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .range(from, to);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScoutedProperty[];
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scouted_properties')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success('הנכס הועבר לארכיון');
    },
    onError: () => {
      toast.error('שגיאה בעדכון הנכס');
    }
  });

  const matchLeadsMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase.functions.invoke('match-scouted-to-leads', {
        body: { property_id: propertyId, send_whatsapp: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success(`נמצאו ${data.leads_matched} התאמות, נשלחו ${data.whatsapp_sent} הודעות`);
    },
    onError: () => {
      toast.error('שגיאה בהתאמת לקוחות');
    }
  });

  const importMutation = useMutation({
    mutationFn: async (scoutedProperty: ScoutedProperty) => {
      // 1. Create property in properties table
      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert({
          title: scoutedProperty.title || 'נכס מיובא',
          address: scoutedProperty.address || `${scoutedProperty.city || ''} ${scoutedProperty.neighborhood || ''}`.trim() || 'לא ידוע',
          city: scoutedProperty.city || 'לא ידוע',
          neighborhood: scoutedProperty.neighborhood,
          property_size: scoutedProperty.size,
          rooms: scoutedProperty.rooms,
          floor: scoutedProperty.floor,
          monthly_rent: scoutedProperty.price,
          description: scoutedProperty.description,
          status: 'unknown',
          contact_status: 'not_contacted',
          contact_attempts: 0,
          property_type: scoutedProperty.property_type || 'rental',
          parking: scoutedProperty.features?.parking || false,
          elevator: scoutedProperty.features?.elevator || false,
          balcony: scoutedProperty.features?.balcony || false,
          mamad: scoutedProperty.features?.mamad || false,
          available: true,
          show_on_website: false,
          notes: `יובא מ-${scoutedProperty.source}: ${scoutedProperty.source_url}`
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // 2. Import images if available
      if (scoutedProperty.images?.length && newProperty) {
        const imageInserts = scoutedProperty.images.slice(0, 10).map((url, idx) => ({
          property_id: newProperty.id,
          image_url: url,
          order_index: idx,
          is_main: idx === 0
        }));
        
        await supabase.from('property_images').insert(imageInserts);
      }
      
      // 3. Update scouted property status to imported
      await supabase
        .from('scouted_properties')
        .update({ status: 'imported' })
        .eq('id', scoutedProperty.id);
      
      return newProperty;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success('הנכס יובא בהצלחה למערכת!', {
        action: {
          label: 'צפה בנכס',
          onClick: () => window.open(`/admin/properties/${data.id}`, '_blank')
        }
      });
      setDetailsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('שגיאה בייבוא הנכס');
    }
  });

  const handleImportProperty = (property: ScoutedProperty | null) => {
    if (!property) return;
    importMutation.mutate(property);
  };

  const filteredProperties = properties?.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.neighborhood?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  const getStatusBadge = (status: string, isActive?: boolean) => {
    if (isActive === false) {
      return <Badge variant="outline" className="text-red-600 border-red-600">לא פעיל</Badge>;
    }
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-green-500">חדש</Badge>;
      case 'matched':
        return <Badge variant="secondary">עבר התאמה</Badge>;
      case 'archived':
        return <Badge variant="outline">ארכיון</Badge>;
      case 'imported':
        return <Badge className="bg-blue-500">יובא למערכת</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-red-600 border-red-600">לא פעיל</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'yad2':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">יד2</Badge>;
      case 'yad2_private':
        return <Badge variant="outline" className="text-orange-400 border-orange-400">יד2 פרטי</Badge>;
      case 'madlan':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">מדלן</Badge>;
      case 'homeless':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">הומלס</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setCurrentPage(1);
    setter(value);
  };

  if (isLoading && !properties) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ דירות</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <div className="flex gap-2 flex-wrap text-xs mt-1">
                  <span className="text-orange-600">יד2: {stats?.bySources?.yad2 || 0}</span>
                  <span className="text-purple-600">הומלס: {stats?.bySources?.homeless || 0}</span>
                  <span className="text-blue-600">מדלן: {stats?.bySources?.madlan || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">נוספו היום</p>
                <p className="text-2xl font-bold">{stats?.today || 0}</p>
                {stats?.today > 0 && (
                  <div className="flex gap-2 flex-wrap text-xs mt-1">
                    {stats?.todayBySources?.yad2 > 0 && (
                      <span className="text-orange-600">יד2: {stats.todayBySources.yad2}</span>
                    )}
                    {stats?.todayBySources?.homeless > 0 && (
                      <span className="text-purple-600">הומלס: {stats.todayBySources.homeless}</span>
                    )}
                    {stats?.todayBySources?.madlan > 0 && (
                      <span className="text-blue-600">מדלן: {stats.todayBySources.madlan}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">השבוע</p>
                <p className="text-2xl font-bold">{stats?.week || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סריקה אחרונה</p>
                <div className="flex gap-2 flex-wrap text-xs mt-1">
                  <span className="text-orange-600">יד2: {stats?.lastScanBySources?.yad2 || 0}</span>
                  <span className="text-purple-600">הומלס: {stats?.lastScanBySources?.homeless || 0}</span>
                  <span className="text-blue-600">מדלן: {stats?.lastScanBySources?.madlan || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>דירות שנסרקו ({totalCount || 0})</span>
          </CardTitle>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי עיר, שכונה..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="new">חדש</SelectItem>
                <SelectItem value="matched">עבר התאמה</SelectItem>
                <SelectItem value="imported">יובא</SelectItem>
                <SelectItem value="archived">ארכיון</SelectItem>
                <SelectItem value="inactive">לא פעיל</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={handleFilterChange(setSourceFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="yad2">יד2</SelectItem>
                <SelectItem value="yad2_private">יד2 פרטי</SelectItem>
                <SelectItem value="madlan">מדלן</SelectItem>
                <SelectItem value="homeless">הומלס</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">מקור</TableHead>
                  <TableHead>פרטים</TableHead>
                  <TableHead className="w-[100px]">מחיר</TableHead>
                  <TableHead className="w-[80px]">חדרים</TableHead>
                  <TableHead className="w-[80px]">גודל</TableHead>
                  <TableHead className="w-[100px]">סטטוס</TableHead>
                  <TableHead className="w-[120px]">התאמות</TableHead>
                  <TableHead className="w-[100px]">נמצא</TableHead>
                  <TableHead className="w-[180px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties?.map((property) => (
                  <TableRow key={property.id} className={property.is_active === false ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getSourceBadge(property.source)}
                        {property.is_private === true && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 w-fit">פרטי</Badge>
                        )}
                        {property.is_private === false && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 w-fit">תיווך</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.title || 'ללא כותרת'}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.city}{property.neighborhood ? ` - ${property.neighborhood}` : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.price ? `₪${property.price.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{property.rooms || '-'}</TableCell>
                    <TableCell>{property.size ? `${property.size} מ"ר` : '-'}</TableCell>
                    <TableCell>{getStatusBadge(property.status, property.is_active)}</TableCell>
                    <TableCell>
                      {property.matched_leads?.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedProperty(property)}
                            >
                              <Users className="h-4 w-4 ml-1" />
                              {property.matched_leads.length} לקוחות
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>לקוחות שהותאמו</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {property.matched_leads.map((match: any, idx: number) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{match.name}</p>
                                      <p className="text-sm text-muted-foreground">{match.phone}</p>
                                    </div>
                                    <Badge>{match.score}% התאמה</Badge>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {match.reasons?.map((reason: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {reason}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(property.first_seen_at), { 
                        addSuffix: true,
                        locale: he 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPropertyDetails(property);
                            setDetailsDialogOpen(true);
                          }}
                          title="צפה בפרטים מלאים"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(property.source_url, '_blank')}
                          title="פתח במקור"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        {property.status !== 'imported' && property.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleImportProperty(property)}
                            disabled={importMutation.isPending}
                            title="ייבא למערכת"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {property.status === 'new' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => matchLeadsMutation.mutate(property.id)}
                            disabled={matchLeadsMutation.isPending}
                            title="התאם ללקוחות ושלח WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {property.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveMutation.mutate(property.id)}
                            title="העבר לארכיון"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {(!filteredProperties || filteredProperties.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      לא נמצאו דירות
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                מציג {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount || 0)} מתוך {totalCount || 0}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  הקודם
                </Button>
                <span className="text-sm">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  הבא
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPropertyDetails && getSourceBadge(selectedPropertyDetails.source)}
              <span>{selectedPropertyDetails?.title || 'פרטי נכס'}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPropertyDetails && (
            <div className="space-y-4">
              {/* Image Gallery */}
              {selectedPropertyDetails.images && selectedPropertyDetails.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedPropertyDetails.images.slice(0, 6).map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt={`תמונה ${i + 1}`}
                      className="rounded-lg object-cover h-24 w-full cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
              
              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">עיר:</span>
                  <span className="font-medium">{selectedPropertyDetails.city || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שכונה:</span>
                  <span className="font-medium">{selectedPropertyDetails.neighborhood || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מחיר:</span>
                  <span className="font-medium">
                    {selectedPropertyDetails.price ? `₪${selectedPropertyDetails.price.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">חדרים:</span>
                  <span className="font-medium">{selectedPropertyDetails.rooms || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">גודל:</span>
                  <span className="font-medium">
                    {selectedPropertyDetails.size ? `${selectedPropertyDetails.size} מ"ר` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">קומה:</span>
                  <span className="font-medium">{selectedPropertyDetails.floor || '-'}</span>
                </div>
              </div>
              
              {/* Description */}
              {selectedPropertyDetails.description && (
                <div>
                  <h4 className="font-medium mb-2">תיאור:</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {selectedPropertyDetails.description}
                  </p>
                </div>
              )}
              
              {/* Features */}
              {selectedPropertyDetails.features && Object.keys(selectedPropertyDetails.features).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">תכונות:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedPropertyDetails.features)
                      .filter(([_, v]) => v)
                      .map(([key]) => (
                        <Badge key={key} variant="secondary">{key}</Badge>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => window.open(selectedPropertyDetails.source_url, '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  פתח במקור
                </Button>
                
                {selectedPropertyDetails.status !== 'imported' && selectedPropertyDetails.status !== 'archived' && (
                  <Button 
                    onClick={() => handleImportProperty(selectedPropertyDetails)}
                    disabled={importMutation.isPending}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    {importMutation.isPending ? 'מייבא...' : 'ייבא למערכת'}
                  </Button>
                )}
                
                {selectedPropertyDetails.status === 'imported' && (
                  <Badge className="bg-blue-500 py-2 px-4">יובא למערכת</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
