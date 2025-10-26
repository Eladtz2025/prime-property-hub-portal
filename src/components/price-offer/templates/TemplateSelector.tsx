import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TemplateCard from './TemplateCard';
import { Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_data: any;
  created_at: string;
  created_by: string;
  is_public: boolean;
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

const TemplateSelector = ({ open, onClose, onSelect }: TemplateSelectorProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const { data, error } = await supabase
        .from('price_offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('price_offer_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'התבנית נמחקה',
        description: 'התבנית נמחקה בהצלחה',
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>בחר תבנית</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            אין תבניות זמינות עדיין
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={{
                  id: template.id,
                  name: template.name,
                  description: template.description,
                  created_at: template.created_at,
                  is_public: template.is_public,
                }}
                onSelect={() => onSelect(template)}
                onDelete={handleDelete}
                canDelete={template.created_by === currentUserId}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelector;
