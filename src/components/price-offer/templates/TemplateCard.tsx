import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_public: boolean;
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const TemplateCard = ({ template, onSelect, onDelete, canDelete }: TemplateCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(template)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{template.name}</h3>
            {template.is_public && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">משותף</span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            נוצר ב-{new Date(template.created_at).toLocaleDateString('he-IL')}
          </p>
        </div>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TemplateCard;
