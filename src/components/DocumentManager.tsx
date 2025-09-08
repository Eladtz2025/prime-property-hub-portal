import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Receipt, Eye, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  recordId: string;
  recordType: 'income' | 'expense';
}

interface DocumentManagerProps {
  documents: Document[];
  onDelete: (documentId: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onDelete
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Receipt className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-red-500" />;
  };

  const isImage = (type: string) => type.startsWith('image/');

  const groupedDocuments = documents.reduce((acc, doc) => {
    const key = doc.recordType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ניהול מסמכים
          </CardTitle>
          <CardDescription>מסמכים וקבלות שהועלו למערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לא נמצאו מסמכים</p>
            <p className="text-sm">העלה קבלות ומסמכים בעת הוספת רשומות כספיות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ניהול מסמכים
        </CardTitle>
        <CardDescription>
          {documents.length} מסמכים במערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={type === 'income' ? 'default' : 'secondary'}>
                  {type === 'income' ? 'הכנסות' : 'הוצאות'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {docs.length} מסמכים
                </span>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} • {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isImage(doc.type) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>{doc.name}</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img
                                  src={doc.url}
                                  alt={doc.name}
                                  className="max-w-full max-h-[60vh] object-contain"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(doc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};