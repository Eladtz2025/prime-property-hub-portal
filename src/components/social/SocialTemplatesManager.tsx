import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, FileText } from 'lucide-react';
import { useSocialTemplates, useSaveSocialTemplate, useDeleteSocialTemplate } from '@/hooks/useSocialPosts';
import { ConfirmDialog } from './ConfirmDialog';

const PLACEHOLDERS = [
  { key: '{address}', label: 'כתובת' },
  { key: '{price}', label: 'מחיר' },
  { key: '{rooms}', label: 'חדרים' },
  { key: '{size}', label: 'גודל' },
  { key: '{floor}', label: 'קומה' },
  { key: '{neighborhood}', label: 'שכונה' },
  { key: '{city}', label: 'עיר' },
  { key: '{description}', label: 'תיאור' },
  { key: '{property_type}', label: 'סוג עסקה' },
];

export const SocialTemplatesManager: React.FC = () => {
  const { data: templates, isLoading } = useSocialTemplates();
  const saveMutation = useSaveSocialTemplate();
  const deleteMutation = useDeleteSocialTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('both');
  const [postType, setPostType] = useState('property_listing');
  const [templateText, setTemplateText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditId('');
    setName('');
    setPlatform('both');
    setPostType('property_listing');
    setTemplateText('');
    setHashtags('');
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setName(t.name);
    setPlatform(t.platform);
    setPostType(t.post_type);
    setTemplateText(t.template_text);
    setHashtags(t.hashtags || '');
    setDialogOpen(true);
  };

  const insertPlaceholder = (key: string) => {
    setTemplateText(prev => prev + key);
  };

  const handleSave = async () => {
    if (!name || !templateText) return;
    await saveMutation.mutateAsync({
      ...(editId ? { id: editId } : {}),
      name,
      platform,
      post_type: postType,
      template_text: templateText,
      hashtags: hashtags || undefined,
    });
    setDialogOpen(false);
  };

  const previewText = templateText
    .replace(/{address}/g, 'הרצל 10')
    .replace(/{price}/g, '₪5,500')
    .replace(/{rooms}/g, '3')
    .replace(/{size}/g, '75')
    .replace(/{floor}/g, '4')
    .replace(/{neighborhood}/g, 'לב העיר')
    .replace(/{city}/g, 'תל אביב')
    .replace(/{description}/g, 'דירה מרווחת ומוארת')
    .replace(/{property_type}/g, 'השכרה');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              תבניות פוסטים
            </CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 ml-1" />
              תבנית חדשה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">טוען...</div>
          ) : !templates || templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין תבניות</p>
              <p className="text-xs mt-1">צרו תבנית חדשה כדי להתחיל</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">שם</TableHead>
                  <TableHead className="text-xs w-24">פלטפורמה</TableHead>
                  <TableHead className="text-xs w-20">סוג</TableHead>
                  <TableHead className="text-xs w-16">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.name}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {t.platform === 'both' ? 'שניהם' : t.platform === 'facebook' ? 'FB' : 'IG'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {t.post_type === 'property_listing' ? 'נכס' : 'כללי'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(t)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => setDeleteConfirm(t.id)}
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
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'עריכת תבנית' : 'תבנית חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">שם התבנית</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="דירה להשכרה — בסיסי" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">פלטפורמה</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">שניהם</SelectItem>
                    <SelectItem value="facebook">פייסבוק</SelectItem>
                    <SelectItem value="instagram">אינסטגרם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">סוג</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property_listing">פרסום נכס</SelectItem>
                    <SelectItem value="general_content">תוכן כללי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">טקסט התבנית</Label>
              <div className="flex flex-wrap gap-1 mb-1">
                {PLACEHOLDERS.map(p => (
                  <Button
                    key={p.key}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-6 px-1.5"
                    onClick={() => insertPlaceholder(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={templateText}
                onChange={e => setTemplateText(e.target.value)}
                placeholder="🏠 דירה {property_type} ב{city}..."
                className="min-h-[100px] text-sm"
                dir="rtl"
              />
            </div>

            <div>
              <Label className="text-xs">האשטגים (אופציונלי)</Label>
              <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#נדלן #דירהלהשכרה" dir="ltr" />
            </div>

            {templateText && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1">תצוגה מקדימה (נתוני דוגמה):</p>
                <p className="text-xs whitespace-pre-wrap">{previewText}</p>
                {hashtags && <p className="text-xs text-primary mt-1" dir="ltr">{hashtags}</p>}
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending || !name || !templateText}>
              {editId ? 'עדכן תבנית' : 'צור תבנית'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת תבנית"
        description="האם אתה בטוח שברצונך למחוק תבנית זו?"
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
