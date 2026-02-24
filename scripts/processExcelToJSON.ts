import * as XLSX from '@e965/xlsx';
import { processExcelToUnified } from '../src/utils/processExcelData';

interface ExcelProperty {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  city: string;
  notes?: string;
  rooms?: number;
  monthly_rent?: number;
  status?: string;
}

const processExcelFile = async () => {
  try {
    // Read the Excel file
    const response = await fetch('/בעלי דירות לסדר. (1).xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('Available sheets:', workbook.SheetNames);
    
    const allProperties: any[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip empty sheets
      if (jsonData.length <= 1) return;
      
      // Get headers from first row
      const headers = jsonData[0] as string[];
      console.log(`Headers in ${sheetName}:`, headers);
      
      // Process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;
        
        const rowData: any = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            rowData[header] = row[index];
          }
        });
        
        // Skip empty rows
        if (Object.keys(rowData).length > 0) {
          allProperties.push(rowData);
        }
      }
    });
    
    console.log(`Total raw properties found: ${allProperties.length}`);
    
    // Process the data using our existing function
    const processedProperties = processExcelToUnified(allProperties);
    
    console.log(`Processed properties: ${processedProperties.length}`);
    
    // Create the unified data structure
    const unifiedData = {
      metadata: {
        created_at: new Date().toISOString(),
        total_properties: processedProperties.length,
        sources: {
          excel_file: "בעלי דירות לסדר. (1).xlsx",
          sheets_processed: workbook.SheetNames.length,
          raw_records: allProperties.length
        }
      },
      properties: processedProperties
    };
    
    console.log('Final unified data:', JSON.stringify(unifiedData, null, 2));
    
    // Write to public directory
    const blob = new Blob([JSON.stringify(unifiedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties-unified.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return unifiedData;
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
};

// Run the processing
processExcelFile().then(data => {
  console.log('Processing completed successfully!');
  console.log(`Generated JSON with ${data.properties.length} properties`);
}).catch(error => {
  console.error('Processing failed:', error);
});