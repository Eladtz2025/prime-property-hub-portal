import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flag, Plus, Trash2, Edit, Users, Percent, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_users: string[] | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export const FeatureFlagsTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);
  const [formRollout, setFormRollout] = useState(0);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת הדגלים');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEnabled(false);
    setFormRollout(0);
    setEditingFlag(null);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormName(flag.name);
    setFormDescription(flag.description || '');
    setFormEnabled(flag.is_enabled);
    setFormRollout(flag.rollout_percentage);
    setDialogOpen(true);
  };

  const saveFlag = async () => {
    if (!formName.trim()) {
      toast.error('שם הדגל הוא שדה חובה');
      return;
    }

    try {
      if (editingFlag) {
        // Update
        const { error } = await supabase
          .from('feature_flags')
          .update({
            name: formName,
            description: formDescription,
            is_enabled: formEnabled,
            rollout_percentage: formRollout,
          })
          .eq('id', editingFlag.id);

        if (error) throw error;
        toast.success('הדגל עודכן');
      } else {
        // Create
        const { error } = await supabase
          .from('feature_flags')
          .insert({
            name: formName,
            description: formDescription,
            is_enabled: formEnabled,
            rollout_percentage: formRollout,
          });

        if (error) throw error;
        toast.success('הדגל נוצר');
      }

      setDialogOpen(false);
      resetForm();
      fetchFlags();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('שם הדגל כבר קיים');
      } else {
        toast.error('שגיאה בשמירה');
      }
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);

      if (error) throw error;
      
      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f
      ));
      toast.success(flag.is_enabled ? 'הדגל כובה' : 'הדגל הופעל');
    } catch (error) {
      toast.error('שגיאה בעדכון');
    }
  };

  const deleteFlag = async (flagId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הדגל?')) return;

    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', flagId);

      if (error) throw error;
      
      setFlags(prev => prev.filter(f => f.id !== flagId));
      toast.success('הדגל נמחק');
    } catch (error) {
      toast.error('שגיאה במחיקה');
    }
  };

  return (
    <div className="space-y-6">
      {/* Flags Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                דגלי פיצ'רים
              </CardTitle>
              <CardDescription>ניהול פיצ'רים והפעלה הדרגתית</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  דגל חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFlag ? 'עריכת דגל' : 'יצירת דגל חדש'}</DialogTitle>
                  <DialogDescription>הגדר דגל פיצ'ר חדש לשליטה בהצגת פיצ'רים</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">שם הדגל</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="new_checkout_flow"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">תיאור</Label>
                    <Textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="תיאור הפיצ'ר..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">מופעל</Label>
                    <Switch
                      id="enabled"
                      checked={formEnabled}
                      onCheckedChange={setFormEnabled}
                    />
                  </div>
                  <div>
                    <Label>אחוז Rollout: {formRollout}%</Label>
                    <Slider
                      value={[formRollout]}
                      onValueChange={([value]) => setFormRollout(value)}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      אחוז המשתמשים שיראו את הפיצ'ר כאשר הוא מופעל
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
                  <Button onClick={saveFlag}>שמור</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {flags.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>Rollout</TableHead>
                  <TableHead>נוצר</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <code className="bg-background px-2 py-1 rounded text-sm">{flag.name}</code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {flag.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => toggleFlag(flag)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.rollout_percentage}%</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(flag.created_at), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openEditDialog(flag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteFlag(flag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין דגלים עדיין</p>
              <p className="text-sm mt-1">צור דגל חדש כדי להתחיל לנהל פיצ'רים</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
