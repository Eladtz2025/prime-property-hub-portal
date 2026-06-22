import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, ExternalLink, Users2, Users, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_CATEGORIES = ['השכרה', 'מכירה', 'שותפים', 'כללי'] as const;
import { useFacebookGroups, useSaveFacebookGroup, useDeleteFacebookGroup, useUpdateFacebookGroup } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from './ConfirmDialog';

type SortKey = 'name' | 'category' | 'members' | 'joined';
type SortDir = 'asc' | 'desc';

// Group size, formatted with Hebrew thousands separators. "—" when unknown.
const formatMembers = (n?: number | null): string =>
  n == null ? '—' : n.toLocaleString('he-IL');

export const FacebookGroupsManager: React.FC = () => {
  const { data: groups, isLoading } = useFacebookGroups();
  const saveMutation = useSaveFacebookGroup();
  const deleteMutation = useDeleteFacebookGroup();
  const updateMutation = useUpdateFacebookGroup();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [groupUrl, setGroupUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Sorting — click any column header to sort; click again to flip direction.
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Sensible default per column: text A→Z, but size/joined most-first.
      setSortDir(key === 'members' || key === 'joined' ? 'desc' : 'asc');
    }
  };

  const openAdd = () => {
    setEditId('');
    setGroupName('');
    setGroupUrl('');
    setCategory('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setNotes('');
    setMemberCount('');
    setIsJoined(false);
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
    setMemberCount(g.member_count != null ? String(g.member_count) : '');
    setIsJoined(!!g.is_joined);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!groupName || !groupUrl) {
      toast({ title: 'שם וקישור חובה', variant: 'destructive' });
      return;
    }
    const finalCategory = isCustomCategory ? customCategory : category;
    const digits = memberCount.replace(/[^\d]/g, '');
    const parsedMembers = digits === '' ? null : parseInt(digits, 10);
    await saveMutation.mutateAsync({
      ...(editId ? { id: editId } : {}),
      group_name: groupName,
      group_url: groupUrl,
      category: finalCategory || undefined,
      notes: notes || undefined,
      member_count: parsedMembers,
      is_joined: isJoined,
      joined_at: isJoined ? new Date().toISOString() : null,
    });
    setDialogOpen(false);
  };

  // One-click membership marker (no dialog) — records when it was marked.
  const toggleJoined = (g: any) => {
    const next = !g.is_joined;
    updateMutation.mutate({
      id: g.id,
      is_joined: next,
      joined_at: next ? new Date().toISOString() : null,
    });
  };

  const existingCustomCategories = [...new Set(
    groups?.map(g => g.category).filter(Boolean).filter(c => !(GROUP_CATEGORIES as readonly string[]).includes(c))
  )] as string[];

  const allCategories = [...GROUP_CATEGORIES, ...existingCustomCategories];

  const sorted = useMemo(() => {
    const list = [...(groups || [])];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a: any, b: any) => {
      // Unknown member counts always sink to the bottom, regardless of direction.
      if (sortKey === 'members') {
        const am = a.member_count, bm = b.member_count;
        if (am == null && bm == null) return 0;
        if (am == null) return 1;
        if (bm == null) return -1;
        return (am - bm) * dir;
      }
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.group_name || '').localeCompare(b.group_name || '', 'he');
      else if (sortKey === 'category') cmp = (a.category || '').localeCompare(b.category || '', 'he');
      else if (sortKey === 'joined') cmp = (a.is_joined ? 1 : 0) - (b.is_joined ? 1 : 0);
      return cmp * dir;
    });
    return list;
  }, [groups, sortKey, sortDir]);

  const total = groups?.length || 0;
  const joinedCount = groups?.filter(g => g.is_joined).length || 0;
  const totalMembers = groups?.reduce((s, g) => s + (g.member_count || 0), 0) || 0;

  const sortIcon = (k: SortKey) =>
    sortKey === k
      ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
      : <ArrowUpDown className="h-3 w-3 opacity-30" />;

  const SortableHead: React.FC<{ k: SortKey; className?: string; children: React.ReactNode }> = ({ k, className, children }) => (
    <TableHead className={cn('text-xs', className)}>
      <button
        type="button"
        onClick={() => handleSort(k)}
        className={cn(
          'inline-flex items-center gap-1 select-none hover:text-foreground transition-colors',
          sortKey === k ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}
      >
        {children}
        {sortIcon(k)}
      </button>
    </TableHead>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              קבוצות פייסבוק
            </CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 ml-1" />
              הוסף קבוצה
            </Button>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-normal">{total} קבוצות</Badge>
              <Badge variant="secondary" className="font-normal gap-1">
                <Check className="h-3 w-3 text-green-600" />
                הצטרפת ל-{joinedCount}
              </Badge>
              {totalMembers > 0 && (
                <Badge variant="secondary" className="font-normal gap-1">
                  <Users className="h-3 w-3" />
                  {formatMembers(totalMembers)} חברים בסך הכול
                </Badge>
              )}
            </div>
          )}
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
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <SortableHead k="name">שם</SortableHead>
                    <SortableHead k="category" className="w-28">קטגוריה</SortableHead>
                    <SortableHead k="members" className="w-24">חברים</SortableHead>
                    <SortableHead k="joined" className="w-32">הצטרפתי</SortableHead>
                    <TableHead className="text-xs w-20 text-muted-foreground">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(g => (
                    <TableRow key={g.id} className={cn(g.is_joined && 'bg-green-50/40 dark:bg-green-950/10')}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                          {g.group_name}
                          {!g.is_active && <Badge variant="outline" className="text-[9px]">לא פעיל</Badge>}
                        </div>
                        {g.notes && <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[260px]">{g.notes}</div>}
                      </TableCell>
                      <TableCell>
                        {g.category
                          ? <Badge variant="secondary" className="font-normal">{g.category}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        <span className={cn('inline-flex items-center gap-1', g.member_count == null && 'text-muted-foreground')}>
                          <Users className="h-3 w-3 opacity-50" />
                          {formatMembers(g.member_count)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {g.is_joined ? (
                          <button type="button" onClick={() => toggleJoined(g)} title="בטל סימון הצטרפות">
                            <Badge className="gap-1 cursor-pointer bg-green-600 hover:bg-green-700 text-white">
                              <Check className="h-3 w-3" />
                              הצטרפתי
                            </Badge>
                          </button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => toggleJoined(g)}
                            title="סמן שכבר הצטרפת לקבוצה"
                          >
                            סמן הצטרפות
                          </Button>
                        )}
                      </TableCell>
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
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">קטגוריה</Label>
                <Select value={isCustomCategory ? '__custom__' : category} onValueChange={(val) => {
                  if (val === '__custom__') {
                    setIsCustomCategory(true);
                    setCategory('__custom__');
                  } else {
                    setIsCustomCategory(false);
                    setCustomCategory('');
                    setCategory(val);
                  }
                }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="בחר קטגוריה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">אחר — יצירת קטגוריה</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    className="mt-2"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="שם קטגוריה חדשה..."
                  />
                )}
              </div>
              <div>
                <Label className="text-xs">מספר חברים (אופציונלי)</Label>
                <Input
                  value={memberCount}
                  onChange={e => setMemberCount(e.target.value)}
                  inputMode="numeric"
                  placeholder="לדוגמה: 12500"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">הערות (אופציונלי)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm pt-1">
              <Checkbox checked={isJoined} onCheckedChange={(v) => setIsJoined(v === true)} />
              כבר הצטרפתי לקבוצה הזו
            </label>
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
