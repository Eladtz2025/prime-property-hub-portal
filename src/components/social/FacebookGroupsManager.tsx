import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, ExternalLink, Copy } from 'lucide-react';
import { useFacebookGroups, useSaveFacebookGroup, useDeleteFacebookGroup } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';

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
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditId('');
    setGroupName('');
    setGroupUrl('');
    setCategory('');
    setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (g: any) => {
    setEditId(g.id);
    setGroupName(g.group_name);
    setGroupUrl(g.group_url);
    setCategory(g.category || '');
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
            <CardTitle className="text-base">קבוצות פייסבוק</CardTitle>
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
            <div className="text-center py-6 text-sm text-muted-foreground">אין קבוצות — הוסיפו קבוצה חדשה</div>
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
                          onClick={() => deleteMutation.mutate(g.id)}
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
              <Label className="text-xs">קטגוריה (אופציונלי)</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="נדל״ן, כללי..." />
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
    </>
  );
};
