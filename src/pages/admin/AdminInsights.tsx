import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Insight {
  id: string;
  type: string;
  title_he: string | null;
  title_en: string | null;
  summary_he: string | null;
  summary_en: string | null;
  content_he: string | null;
  content_en: string | null;
  image_url: string | null;
  category: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number | null;
  created_at: string | null;
}

const emptyForm: Omit<Insight, "id" | "created_at"> = {
  type: "article",
  title_he: "",
  title_en: "",
  summary_he: "",
  summary_en: "",
  content_he: "",
  content_en: "",
  image_url: "",
  category: "",
  is_published: false,
  published_at: new Date().toISOString(),
  sort_order: 0,
};

const AdminInsights = () => {
  const [items, setItems] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("insights" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setItems(data as unknown as Insight[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openNew = (type: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, type });
    setDialogOpen(true);
  };

  const openEdit = (item: Insight) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title_he: item.title_he || "",
      title_en: item.title_en || "",
      summary_he: item.summary_he || "",
      summary_en: item.summary_en || "",
      content_he: item.content_he || "",
      content_en: item.content_en || "",
      image_url: item.image_url || "",
      category: item.category || "",
      is_published: item.is_published,
      published_at: item.published_at || new Date().toISOString(),
      sort_order: item.sort_order || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      title_he: form.title_he || null,
      title_en: form.title_en || null,
      summary_he: form.summary_he || null,
      summary_en: form.summary_en || null,
      content_he: form.content_he || null,
      content_en: form.content_en || null,
      image_url: form.image_url || null,
      category: form.category || null,
    };

    if (editingId) {
      const { error } = await (supabase.from("insights" as any) as any).update(payload).eq("id", editingId);
      if (error) { toast.error("שגיאה בשמירה"); return; }
      toast.success("עודכן בהצלחה");
    } else {
      const { error } = await (supabase.from("insights" as any) as any).insert(payload);
      if (error) { toast.error("שגיאה ביצירה"); return; }
      toast.success("נוצר בהצלחה");
    }
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("insights" as any) as any).delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    toast.success("נמחק בהצלחה");
    fetchItems();
  };

  const togglePublish = async (item: Insight) => {
    await (supabase.from("insights" as any) as any)
      .update({ is_published: !item.is_published })
      .eq("id", item.id);
    fetchItems();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול תובנות</h1>
        <div className="flex gap-2">
          <Button onClick={() => openNew("article")} size="sm">
            <FileText className="h-4 w-4 ml-1" />
            כתבה חדשה
          </Button>
          <Button onClick={() => openNew("guide")} size="sm" variant="outline">
            <BookOpen className="h-4 w-4 ml-1" />
            מדריך חדש
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">אין תוכן עדיין. צור כתבה או מדריך חדש.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right p-3">כותרת</th>
                <th className="text-right p-3">סוג</th>
                <th className="text-right p-3">קטגוריה</th>
                <th className="text-center p-3">סטטוס</th>
                <th className="text-center p-3">סדר</th>
                <th className="text-center p-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{item.title_he || item.title_en || "ללא כותרת"}</div>
                    {item.title_en && item.title_he && (
                      <div className="text-xs text-muted-foreground">{item.title_en}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted">
                      {item.type === "article" ? <><FileText className="h-3 w-3" /> כתבה</> : <><BookOpen className="h-3 w-3" /> מדריך</>}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{item.category || "—"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => togglePublish(item)} className="inline-flex items-center gap-1 text-xs">
                      {item.is_published ? (
                        <span className="text-green-600 flex items-center gap-1"><Eye className="h-3 w-3" /> מפורסם</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> טיוטה</span>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{item.sort_order ?? 0}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת תוכן</AlertDialogTitle>
                            <AlertDialogDescription>האם אתה בטוח? פעולה זו לא ניתנת לביטול.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "עריכת תוכן" : "תוכן חדש"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>סוג</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">כתבה</SelectItem>
                    <SelectItem value="guide">מדריך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>קטגוריה</Label>
                <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder='נדל"ן, השקעות, טיפים...' />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>כותרת (עברית)</Label>
                <Input value={form.title_he || ""} onChange={(e) => setForm({ ...form, title_he: e.target.value })} />
              </div>
              <div>
                <Label>Title (English)</Label>
                <Input value={form.title_en || ""} onChange={(e) => setForm({ ...form, title_en: e.target.value })} dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>תקציר (עברית)</Label>
                <Textarea value={form.summary_he || ""} onChange={(e) => setForm({ ...form, summary_he: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Summary (English)</Label>
                <Textarea value={form.summary_en || ""} onChange={(e) => setForm({ ...form, summary_en: e.target.value })} rows={2} dir="ltr" />
              </div>
            </div>

            <div>
              <Label>תוכן מלא — עברית (Markdown)</Label>
              <Textarea value={form.content_he || ""} onChange={(e) => setForm({ ...form, content_he: e.target.value })} rows={6} className="font-mono text-sm" />
            </div>

            <div>
              <Label>Full Content — English (Markdown)</Label>
              <Textarea value={form.content_en || ""} onChange={(e) => setForm({ ...form, content_en: e.target.value })} rows={6} dir="ltr" className="font-mono text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>URL תמונה</Label>
                <Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" placeholder="https://..." />
              </div>
              <div>
                <Label>סדר תצוגה</Label>
                <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>מפורסם</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
              <Button onClick={handleSave}>{editingId ? "שמור שינויים" : "צור"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInsights;
