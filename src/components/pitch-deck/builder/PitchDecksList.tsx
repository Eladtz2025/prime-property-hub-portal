import { usePitchDecks, useDeletePitchDeck } from '@/hooks/usePitchDecks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Eye,
  MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const PitchDecksList = () => {
  const { data: decks, isLoading } = usePitchDecks();
  const deleteMutation = useDeletePitchDeck();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/offer/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('הלינק הועתק');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        טוען מצגות...
      </div>
    );
  }

  if (!decks?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין מצגות עדיין
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{deck.title}</span>
                <Badge variant={deck.is_active ? 'default' : 'secondary'}>
                  {deck.is_active ? 'פעיל' : 'טיוטה'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {deck.language === 'he' ? 'עברית' : 'English'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>/{deck.slug}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {deck.views_count}
                </span>
                <span>·</span>
                <span>
                  {format(new Date(deck.created_at), 'dd/MM/yyyy', { locale: he })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/offer/${deck.slug}`, '_blank')}
                title="צפייה"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyLink(deck.slug)}
                title="העתק לינק"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/admin-dashboard/pitch-decks/${deck.id}`)}>
                    <Edit2 className="h-4 w-4 ml-2" />
                    עריכה
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setDeleteId(deck.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחיקה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מצגת</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק מצגת זו? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PitchDecksList;
