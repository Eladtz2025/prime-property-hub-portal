import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, ExternalLink, Users2 } from 'lucide-react';

const GROUP_CATEGORIES = ['השכרה', 'מכירה', 'שותפים', 'כללי'] as const;
import { useFacebookGroups, useSaveFacebookGroup, useDeleteFacebookGroup } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from './ConfirmDialog';

export const FacebookGroupsManager: React.FC = () => {
  const { data: groups, isLoading } = useFacebookGroups();
  const saveMutation = useSaveFacebookGroup();
  const deleteMutation = useDeleteFacebookGroup();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [groupUrl, setGroupUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditId('');
    setGroupName('');
    setGroupUrl('');
    setCategory('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (g: any) => {
    setEditId(g.id);
    setGroupName(g.group_name);
    setGroupUrl(g.group_url);
    const cat = g.category || '';
    const isPredefined = GROUP_CATEGORIES.includes(cat as any);
    setCategory(isPredefined ? cat : (cat ? '__custom__' : ''));
    setIsCustomCategory(!isPredefined && !!cat);
    setCustomCategory(!isPredefined ? cat : '');
    setNotes(g.notes || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!groupName || !groupUrl) {
      toast({ title: 'שם וקישור חובה', variant: 'destructive' });
      return;
    }
    await saveMutation.mutateAsync({
      ...(editId ? { id: editId } : {}),
      group_name: groupName,
      group_url: groupUrl,
      category: category || undefined,
      notes: notes || undefined,
    });
    setDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              קבוצות פייסבוק
            </CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 ml-1" />
              הוסף קבוצה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            בגלל מגבלות Meta, פרסום לקבוצות הוא חצי-אוטומטי — המערכת מכינה את התוכן ופותחת את הקבוצה.
          </p>
          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">טוען...</div>
          ) : !groups || groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין קבוצות</p>
              <p className="text-xs mt-1">הוסיפו קבוצה חדשה כדי להתחיל</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">שם</TableHead>
                  <TableHead className="text-xs w-24">קטגוריה</TableHead>
                  <TableHead className="text-xs w-20">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        {g.group_name}
                        {!g.is_active && <Badge variant="outline" className="text-[9px]">לא פעיל</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.category || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <a href={g.group_url} target="_blank" rel="noopener">
                          <Button size="icon" variant="ghost" className="h-6 w-6" title="פתח קבוצה">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(g)} title="ערוך">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => setDeleteConfirm(g.id)}
                          title="מחק"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'עריכת קבוצה' : 'הוספת קבוצה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">שם הקבוצה</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="נדל״ן תל אביב" />
            </div>
            <div>
              <Label className="text-xs">קישור לקבוצה</Label>
              <Input value={groupUrl} onChange={e => setGroupUrl(e.target.value)} placeholder="https://facebook.com/groups/..." dir="ltr" />
            </div>
            <div>
              <Label className="text-xs">קטגוריה</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="בחר קטגוריה..." />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">הערות (אופציונלי)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
              {editId ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת קבוצה"
        description="האם אתה בטוח שברצונך למחוק קבוצה זו?"
        confirmLabel="מחק"
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirm) deleteMutation.mutate(deleteConfirm);
          setDeleteConfirm(null);
        }}
      />
    </>
  );
};
