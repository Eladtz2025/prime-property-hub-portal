import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  FileText, 
  Calendar,
  Building,
  DollarSign,
  Users,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ReportsExporterProps {
  properties: any[];
  tenants: any[];
  financialData: any[];
  maintenanceData: any[];
  messagesData: any[];
}

export const ReportsExporter: React.FC<ReportsExporterProps> = ({
  properties,
  tenants,
  financialData,
  maintenanceData,
  messagesData
}) => {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    {
      id: 'properties',
      name: 'דוח נכסים',
      description: 'רשימת כל הנכסים עם פרטים מלאים',
      icon: Building,
      data: properties
    },
    {
      id: 'tenants',
      name: 'דוח דיירים',
      description: 'רשימת דיירים פעילים וחוזים',
      icon: Users,
      data: tenants
    },
    {
      id: 'financial',
      name: 'דוח פיננסי',
      description: 'הכנסות, הוצאות ותזרים מזומנים',
      icon: DollarSign,
      data: financialData
    },
    {
      id: 'maintenance',
      name: 'דוח תחזוקה',
      description: 'בקשות תחזוקה ועלויות',
      icon: Wrench,
      data: maintenanceData
    },
    {
      id: 'communications',
      name: 'דוח תקשורת',
      description: 'היסטוריית התכתבויות עם דיירים',
      icon: MessageSquare,
      data: messagesData
    }
  ];

  const handleReportToggle = (reportId: string, checked: boolean) => {
    setSelectedReports(prev => 
      checked 
        ? [...prev, reportId]
        : prev.filter(id => id !== reportId)
    );
  };

  const generateCSV = (data: any[], filename: string) => {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          // Escape commas and quotes
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async (reportId: string) => {
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    setIsGenerating(true);
    
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      let filteredData = report.data;

      // Filter by date range if applicable
      if (reportId === 'financial' || reportId === 'maintenance' || reportId === 'communications') {
        filteredData = report.data.filter((item: any) => {
          const itemDate = new Date(item.created_at || item.transaction_date);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      if (reportFormat === 'csv') {
        const csvContent = generateCSV(filteredData, `${report.name}_${timestamp}.csv`);
        downloadFile(csvContent, `${report.name}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      } else if (reportFormat === 'excel') {
        // For Excel format, we'll create a simple HTML table that Excel can import
        const htmlContent = `
          <html>
            <head>
              <meta charset="utf-8">
              <title>${report.name}</title>
            </head>
            <body>
              <h1>${report.name}</h1>
              <p>תאריך יצירה: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
              <p>טווח תאריכים: ${dateRange.start} עד ${dateRange.end}</p>
              <table border="1" style="border-collapse: collapse;">
                <thead>
                  <tr>
                    ${Object.keys(filteredData[0] || {}).map(key => `<th>${key}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${filteredData.map((row: any) => `
                    <tr>
                      ${Object.values(row).map((value: any) => 
                        `<td>${typeof value === 'object' ? JSON.stringify(value) : value || ''}</td>`
                      ).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        downloadFile(htmlContent, `${report.name}_${timestamp}.xls`, 'application/vnd.ms-excel');
      } else {
        // PDF format - create a simple HTML that can be printed as PDF
        const pdfContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
            <head>
              <meta charset="utf-8">
              <title>${report.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .header { margin-bottom: 30px; }
                .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${report.name}</h1>
                <p><strong>תאריך יצירה:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <p><strong>טווח תאריכים:</strong> ${dateRange.start} עד ${dateRange.end}</p>
              </div>
              
              <div class="summary">
                <h3>סיכום</h3>
                <p><strong>סה"כ רשומות:</strong> ${filteredData.length}</p>
                ${reportId === 'financial' ? `
                  <p><strong>סה"כ הכנסות:</strong> ₪${filteredData.filter((item: any) => item.type === 'income').reduce((sum: number, item: any) => sum + (item.amount || 0), 0).toLocaleString()}</p>
                  <p><strong>סה"כ הוצאות:</strong> ₪${filteredData.filter((item: any) => item.type === 'expense').reduce((sum: number, item: any) => sum + (item.amount || 0), 0).toLocaleString()}</p>
                ` : ''}
              </div>

              <table>
                <thead>
                  <tr>
                    ${Object.keys(filteredData[0] || {}).map(key => `<th>${key}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${filteredData.map((row: any) => `
                    <tr>
                      ${Object.values(row).map((value: any) => 
                        `<td>${typeof value === 'object' ? JSON.stringify(value) : value || ''}</td>`
                      ).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="margin-top: 50px; font-size: 12px; color: #666;">
                <p>דוח זה נוצר באמצעות מערכת PrimePropertyAI</p>
              </div>
            </body>
          </html>
        `;
        downloadFile(pdfContent, `${report.name}_${timestamp}.html`, 'text/html');
      }

      toast({
        title: "דוח נוצר בהצלחה",
        description: `${report.name} ירד למחשב שלך`
      });
    } catch (error) {
      toast({
        title: "שגיאה ביצירת הדוח",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllReports = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: "לא נבחרו דוחות",
        description: "אנא בחר לפחות דוח אחד",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    for (const reportId of selectedReports) {
      await generateReport(reportId);
      // Add small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            יצוא דוחות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">טווח תאריכים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">תאריך התחלה</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">תאריך סיום</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Report Format */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">פורמט הדוח</h3>
            <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (להדפסה)</SelectItem>
                <SelectItem value="excel">Excel (XLS)</SelectItem>
                <SelectItem value="csv">CSV (נתונים גולמיים)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">סוגי דוחות</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map(report => {
                const Icon = report.icon;
                const isSelected = selectedReports.includes(report.id);
                
                return (
                  <Card 
                    key={report.id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleReportToggle(report.id, !isSelected)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleReportToggle(report.id, checked as boolean)}
                        />
                        <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.data.length} רשומות זמינות
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateReport(report.id);
                          }}
                          disabled={isGenerating || report.data.length === 0}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Generate All Button */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={generateAllReports}
              disabled={isGenerating || selectedReports.length === 0}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  יוצר דוחות...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  ייצא דוחות נבחרים ({selectedReports.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>ייצוא מהיר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReports(['properties', 'tenants']);
                setReportFormat('pdf');
                generateAllReports();
              }}
              disabled={isGenerating}
            >
              <Building className="w-4 h-4 mr-2" />
              דוח נכסים ודיירים
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReports(['financial']);
                setReportFormat('excel');
                generateReport('financial');
              }}
              disabled={isGenerating}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              דוח פיננסי חודשי
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReports(['maintenance']);
                setReportFormat('csv');
                generateReport('maintenance');
              }}
              disabled={isGenerating}
            >
              <Wrench className="w-4 h-4 mr-2" />
              דוח תחזוקה
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};