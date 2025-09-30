import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { processExcelToUnified } from '@/utils/processExcelData';
import { supabase } from '@/integrations/supabase/client';

export const ExcelImporter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [stats, setStats] = useState<{ total: number; successful: number; failed: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setStats(null);

    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Process all sheets
      let allData: any[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        allData = [...allData, ...jsonData];
      });

      console.log(`Extracted ${allData.length} rows from Excel`);

      // Process the data
      const processedProperties = processExcelToUnified(allData);
      console.log(`Processed ${processedProperties.length} properties`);

      if (processedProperties.length === 0) {
        throw new Error('No valid properties found in the file');
      }

      // Send to Edge Function
      const { data: result, error } = await supabase.functions.invoke('process-and-import-properties', {
        body: { properties: processedProperties }
      });

      if (error) throw error;

      setStats(result.stats);
      toast.success(`Import completed! ${result.stats.successful} properties imported successfully`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Properties from Excel
        </CardTitle>
        <CardDescription>
          Upload an Excel file to import property data into the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById('excel-upload')?.click()}
            disabled={isProcessing}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Upload Excel File'}
          </Button>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          {fileName && (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          )}
        </div>

        {stats && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Import Results
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-bold">{stats.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Successful</div>
                <div className="font-bold text-green-600">{stats.successful}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="font-bold text-red-600">{stats.failed}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
