import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Upload, Download, Trash2, Plus, Loader2 } from 'lucide-react';

interface Property {
  property_id: string;
  property_address: string;
}

interface Document {
  id: string;
  property_id: string;
  name: string;
  type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  mime_type: string;
}

interface OwnerDocumentsProps {
  properties: Property[];
}

export const OwnerDocuments: React.FC<OwnerDocumentsProps> = ({ properties }) => {
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['owner-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get property IDs for this owner
      const { data: ownerProperties } = await supabase
        .from('property_owners')
        .select('property_id')
        .eq('owner_id', user.id);

      const propertyIds = ownerProperties?.map(p => p.property_id) || [];

      if (propertyIds.length === 0) return [];

      // Fetch documents for these properties
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .in('property_id', propertyIds)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProperty || !documentType || !user) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedProperty}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('financial-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: dbError } = await supabase
        .from('property_documents')
        .insert({
          property_id: selectedProperty,
          name: file.name,
          type: documentType,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success('המסמך הועלה בהצלחה');
      setIsUploadModalOpen(false);
      setFile(null);
      setSelectedProperty('');
      setDocumentType('');
      refetch();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('שגיאה בהעלאת המסמך');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

    try {
      // Extract file path from URL
      const urlParts = doc.file_url.split('/');
      const fileName = urlParts.slice(-3).join('/'); // user_id/property_id/filename

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('financial-documents')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast.success('המסמך נמחק בהצלחה');
      refetch();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('שגיאה במחיקת המסמך');
    }
  };

  const getPropertyAddress = (propertyId: string) => {
    return properties.find(p => p.property_id === propertyId)?.property_address || 'נכס לא ידוע';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען מסמכים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>מסמכים</CardTitle>
              <CardDescription>נהל את המסמכים של הנכסים שלך</CardDescription>
            </div>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              העלה מסמך
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">אין מסמכים עדיין</p>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="h-4 w-4 ml-2" />
                העלה מסמך ראשון
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-medium">{doc.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{getPropertyAddress(doc.property_id)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>העלה מסמך חדש</DialogTitle>
            <DialogDescription>
              העלה חוזה, תעודת זהות, שטר חוב או כל מסמך אחר
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">נכס *</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר נכס" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop) => (
                    <SelectItem key={prop.property_id} value={prop.property_id}>
                      {prop.property_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">סוג מסמך *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג מסמך" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חוזה שכירות">חוזה שכירות</SelectItem>
                  <SelectItem value="תעודת זהות">תעודת זהות</SelectItem>
                  <SelectItem value="שטר חוב">שטר חוב</SelectItem>
                  <SelectItem value="ערבות בנקאית">ערבות בנקאית</SelectItem>
                  <SelectItem value="קבלה">קבלה</SelectItem>
                  <SelectItem value="חשבונית">חשבונית</SelectItem>
                  <SelectItem value="אישור העברה">אישור העברה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">קובץ *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  נבחר: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
              >
                ביטול
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                העלה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
