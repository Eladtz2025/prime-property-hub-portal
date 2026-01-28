import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, CheckCircle, MapPin, Home, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface LeadInfo {
  id: string;
  name: string;
  preferred_cities: string[] | null;
  preferred_neighborhoods: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  rooms_min: number | null;
  rooms_max: number | null;
  property_type: string | null;
}

interface PersonalScoutMatch {
  id: string;
  source: string;
  source_url: string | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  price: number | null;
  rooms: number | null;
  floor: number | null;
  size: number | null;
  is_private: boolean | null;
  is_reviewed: boolean | null;
  created_at: string | null;
}

interface PersonalScoutMatchesDialogProps {
  lead: LeadInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PersonalScoutMatchesDialog: React.FC<PersonalScoutMatchesDialogProps> = ({
  lead,
  open,
  onOpenChange
}) => {
  const queryClient = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Fetch matches for this lead
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['personal-scout-matches', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_scout_matches')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PersonalScoutMatch[];
    },
    enabled: open
  });

  // Mark as reviewed mutation
  const markReviewedMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('personal_scout_matches')
        .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
        .eq('id', matchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('סומן כנבדק');
      queryClient.invalidateQueries({ queryKey: ['personal-scout-matches', lead.id] });
    }
  });

  const filteredMatches = sourceFilter === 'all' 
    ? matches 
    : matches.filter(m => m.source === sourceFilter);

  const sources = [...new Set(matches.map(m => m.source))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            התאמות עבור {lead.name}
          </DialogTitle>
        </DialogHeader>

        {/* Lead Preferences Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap gap-2 text-sm">
            {lead.preferred_cities?.length ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {lead.preferred_cities.join(', ')}
              </Badge>
            ) : null}
            {(lead.budget_min || lead.budget_max) && (
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {(lead.budget_min || 0).toLocaleString()}-{(lead.budget_max || 0).toLocaleString()} ₪
              </Badge>
            )}
            {(lead.rooms_min || lead.rooms_max) && (
              <Badge variant="outline">
                {lead.rooms_min || '?'}-{lead.rooms_max || '?'} חדרים
              </Badge>
            )}
            {lead.preferred_neighborhoods?.length ? (
              <Badge variant="outline">
                {lead.preferred_neighborhoods.length} שכונות
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Filter by Source */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredMatches.length} התאמות
          </span>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="כל המקורות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המקורות</SelectItem>
              {sources.map(source => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Matches Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">טוען...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">אין התאמות</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">מקור</TableHead>
                  <TableHead className="text-right">כתובת</TableHead>
                  <TableHead className="text-right">שכונה</TableHead>
                  <TableHead className="text-right">מחיר</TableHead>
                  <TableHead className="text-center">חדרים</TableHead>
                  <TableHead className="text-center">קומה</TableHead>
                  <TableHead className="text-center">מ"ר</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow 
                    key={match.id}
                    className={match.is_reviewed ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <Badge variant="outline">{match.source}</Badge>
                    </TableCell>
                    <TableCell>{match.address || '-'}</TableCell>
                    <TableCell>{match.neighborhood || '-'}</TableCell>
                    <TableCell>
                      {match.price ? `${match.price.toLocaleString()} ₪` : '-'}
                    </TableCell>
                    <TableCell className="text-center">{match.rooms || '-'}</TableCell>
                    <TableCell className="text-center">{match.floor ?? '-'}</TableCell>
                    <TableCell className="text-center">{match.size || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {match.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={match.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {!match.is_reviewed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markReviewedMutation.mutate(match.id)}
                            disabled={markReviewedMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
