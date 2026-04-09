import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, Download, Trash2, Loader2, File, FileImage, FileCheck } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from '@/utils/logger';

interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_size?: number;
  uploaded_at: string;
}

interface PropertyDocumentsProps {
  propertyId: string;
}

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'חוזה שכירות' },
  { value: 'id', label: 'תעודת זהות' },
  { value: 'promissory_note', label: 'שטר חוב' },
  { value: 'bank_guarantee', label: 'ערבות בנקאית' },
  { value: 'invoice', label: 'קבלה/חשבונית' },
  { value: 'transfer', label: 'אישור העברה' },
  { value: 'certificate', label: 'אישור/תעודה' },
  { value: 'other', label: 'אחר' },
];

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'contract':
      return <FileCheck className="h-4 w-4 text-green-600" />;
    case 'id':
      return <FileImage className="h-4 w-4 text-blue-600" />;
    case 'invoice':
      return <FileText className="h-4 w-4 text-orange-600" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ propertyId }) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('contract');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (propertyId) {
      loadDocuments();
    }
  }, [propertyId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('id, name, type, file_url, file_size, uploaded_at')
        .eq('property_id', propertyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      logger.error('Error loading documents:', error);
      toast({
        title: "שגיאה בטעינת מסמכים",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('financial-documents')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          name: file.name,
          type: selectedType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "המסמך הועלה בהצלחה",
      });
      
      loadDocuments();
    } catch (error: any) {
      logger.error('Error uploading document:', error);
      toast({
        title: "שגיאה בהעלאת מסמך",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (doc: PropertyDocument) => {
    if (!confirm(`למחוק את "${doc.name}"?`)) return;

    try {
      // Extract file path from URL
      const urlParts = doc.file_url.split('/financial-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('financial-documents')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "המסמך נמחק",
      });
      
      loadDocuments();
    } catch (error: any) {
      logger.error('Error deleting document:', error);
      toast({
        title: "שגיאה במחיקת מסמך",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">מסמכים</Label>
      
      {/* Document list */}
      <div className="border rounded-md bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            אין מסמכים
          </div>
        ) : (
          <ScrollArea className="h-[100px]">
            <div className="p-2 space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 p-1.5 bg-background rounded text-xs group hover:bg-accent/50 transition-colors"
                >
                  {getDocumentIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{doc.name}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {getTypeLabel(doc.type)} {formatFileSize(doc.file_size) && `• ${formatFileSize(doc.file_size)}`}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Upload controls */}
      <div className="flex gap-2">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          העלה
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};
