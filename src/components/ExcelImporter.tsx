import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from '@e965/xlsx';
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
      console.log('📁 Starting file upload process...');
      
      // Read the Excel file
      const data = await file.arrayBuffer();
      console.log('📖 File read successfully, parsing Excel...');
      
      const workbook = XLSX.read(data);
      console.log(`📊 Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
      
      // Process all sheets
      let allData: any[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(`   - Sheet "${sheetName}": ${jsonData.length} rows`);
        allData = [...allData, ...jsonData];
      });

      console.log(`✅ Extracted ${allData.length} total rows from Excel`);
      
      if (allData.length === 0) {
        throw new Error('קובץ האקסל ריק או לא מכיל נתונים');
      }

      // Process the data
      console.log('🔄 Processing properties...');
      const processedProperties = processExcelToUnified(allData);
      console.log(`✅ Processed ${processedProperties.length} valid properties`);

      if (processedProperties.length === 0) {
        throw new Error('לא נמצאו נכסים תקינים בקובץ - וודא שהקובץ מכיל עמודות: כתובת, בעל הנכס, טלפון');
      }

      // Send to Edge Function
      console.log('📤 Sending data to Edge Function...');
      toast.info(`מעבד ${processedProperties.length} נכסים...`);
      
      const { data: result, error } = await supabase.functions.invoke('process-and-import-properties', {
        body: { properties: processedProperties }
      });

      console.log('📥 Edge Function response:', { result, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`שגיאה בשרת: ${error.message}`);
      }

      if (!result || !result.stats) {
        throw new Error('תשובה לא תקינה מהשרת');
      }

      console.log('✅ Import completed successfully!', result.stats);
      setStats(result.stats);
      toast.success(`הייבוא הושלם! ${result.stats.successful} נכסים נוספו בהצלחה`);
      
      if (result.stats.failed > 0) {
        toast.warning(`${result.stats.failed} נכסים נכשלו בייבוא`);
      }
      
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
