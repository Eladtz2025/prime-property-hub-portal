import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link, Search, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const ManualScoutForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');

  const scrapeMutation = useMutation({
    mutationFn: async (scrapedUrl: string) => {
      const { data, error } = await supabase.functions.invoke('scout-properties', {
        body: { manual_url: scrapedUrl }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scout-runs'] });
      queryClient.invalidateQueries({ queryKey: ['scout-stats'] });
      
      if (data.properties_found > 0) {
        toast.success(`נמצאו ${data.properties_found} דירות, ${data.new_properties} חדשות`);
      } else {
        toast.info('לא נמצאו דירות בדף זה');
      }
      setUrl('');
    },
    onError: (error) => {
      console.error('Scrape error:', error);
      toast.error('שגיאה בסריקת הדף');
    }
  });

  const runAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('scout-properties', {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scout-runs'] });
      queryClient.invalidateQueries({ queryKey: ['scout-stats'] });
      toast.success(`סריקה הושלמה: ${data.properties_found} דירות, ${data.new_properties} חדשות`);
    },
    onError: (error) => {
      console.error('Run all error:', error);
      toast.error('שגיאה בהרצת סריקות');
    }
  });

  const matchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('match-scouted-to-leads', {
        body: { send_whatsapp: false }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      toast.success(`הותאמו ${data.leads_matched} לקוחות`);
    },
    onError: (error) => {
      console.error('Match error:', error);
      toast.error('שגיאה בהתאמת לקוחות');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    if (!url.includes('yad2') && !url.includes('madlan')) {
      toast.error('נא להזין קישור מיד2 או מדלן');
      return;
    }
    
    scrapeMutation.mutate(url.trim());
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="url" className="sr-only">קישור לסריקה</Label>
              <div className="relative">
                <Link className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="הדבק קישור מיד2 או מדלן..."
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={!url.trim() || scrapeMutation.isPending}
            >
              {scrapeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Search className="h-4 w-4 ml-2" />
              )}
              סרוק דף
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => runAllMutation.mutate()}
              disabled={runAllMutation.isPending}
            >
              {runAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Zap className="h-4 w-4 ml-2" />
              )}
              הרץ כל ההגדרות
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => matchMutation.mutate()}
              disabled={matchMutation.isPending}
            >
              {matchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              התאם
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 טיפ: חפש בייד2 או מדלן עם הפילטרים שלך, והדבק את הקישור כאן לסריקה מיידית
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
