import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, File, Image, Trash2, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

interface ReceiptUploaderProps {
  recordId?: string;
  recordType: 'income' | 'expense';
  onUploadComplete?: (fileUrl: string) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  recordId,
  recordType,
  onUploadComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const acceptedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    document: ['application/pdf']
  };

  const allAcceptedTypes = [...acceptedTypes.image, ...acceptedTypes.document];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!allAcceptedTypes.includes(file.type)) {
      toast({
        title: "סוג קובץ לא נתמך",
        description: "נתמכים רק קבצי תמונה (JPEG, PNG, WebP, HEIC) ו-PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "קובץ גדול מדי",
        description: "גודל הקובץ לא יכול לעבור 50MB",
        variant: "destructive",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${recordType}/${recordId || 'temp'}_${timestamp}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('financial-documents')
        .getPublicUrl(fileName);

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      onUploadComplete?.(publicUrl);

      toast({
        title: "הקובץ הועלה בהצלחה",
        description: `${file.name} נשמר במערכת`,
      });

    } catch (error) {
      logger.error('Error uploading file:', error);
      toast({
        title: "שגיאה בהעלאת הקובץ",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase.storage
        .from('financial-documents')
        .remove([fileId]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "הקובץ נמחק",
        description: "הקובץ הוסר מהמערכת",
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      toast({
        title: "שגיאה במחיקת הקובץ",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (acceptedTypes.image.includes(type)) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const isImage = (type: string) => acceptedTypes.image.includes(type);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          העלאת קבלות ומסמכים
        </CardTitle>
        <CardDescription>
          העלה תמונות של קבלות או קבצי PDF לתיעוד הרשומה הכספית
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={allAcceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">גרור קובץ לכאן או לחץ להעלאה</p>
            <p className="text-xs text-muted-foreground">
              נתמכים: תמונות (JPEG, PNG, WebP, HEIC) ו-PDF עד 50MB
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4"
          >
            {uploading ? 'מעלה...' : 'בחר קובץ'}
          </Button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">קבצים שהועלו</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isImage(file.type) && (
                      <Dialog open={showPreview === file.id} onOpenChange={(open) => setShowPreview(open ? file.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{file.name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="max-w-full max-h-[60vh] object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Type Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>סוגי קבצים נתמכים:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>תמונות: JPEG, PNG, WebP, HEIC</li>
            <li>מסמכים: PDF</li>
            <li>גודל מקסימלי: 50MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};