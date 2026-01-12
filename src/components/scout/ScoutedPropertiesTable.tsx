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
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface ScoutedProperty {
  id: string;
  source: string;
  source_url: string;
  title: string | null;
  city: string | null;
  neighborhood: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  property_type: string | null;
  status: string;
  first_seen_at: string;
  matched_leads: any[];
  features: Record<string, boolean>;
}

export const ScoutedPropertiesTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<ScoutedProperty | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['scouted-properties', statusFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('scouted_properties')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .limit(100);

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
      toast.success(`נמצאו ${data.leads_matched} התאמות, נשלחו ${data.whatsapp_sent} הודעות`);
    },
    onError: () => {
      toast.error('שגיאה בהתאמת לקוחות');
    }
  });

  const filteredProperties = properties?.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.neighborhood?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-green-500">חדש</Badge>;
      case 'notified':
        return <Badge variant="secondary">נשלח</Badge>;
      case 'archived':
        return <Badge variant="outline">ארכיון</Badge>;
      case 'imported':
        return <Badge className="bg-blue-500">יובא למערכת</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'yad2':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">יד2</Badge>;
      case 'madlan':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">מדלן</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>דירות שנסרקו ({filteredProperties?.length || 0})</span>
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="new">חדש</SelectItem>
              <SelectItem value="notified">נשלח</SelectItem>
              <SelectItem value="imported">יובא</SelectItem>
              <SelectItem value="archived">ארכיון</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="מקור" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="yad2">יד2</SelectItem>
              <SelectItem value="madlan">מדלן</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
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
                <TableHead className="w-[150px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties?.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{getSourceBadge(property.source)}</TableCell>
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
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
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
                        onClick={() => window.open(property.source_url, '_blank')}
                        title="פתח במקור"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
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
      </CardContent>
    </Card>
  );
};
