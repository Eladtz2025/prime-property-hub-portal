import { ExcelImporter } from '@/components/ExcelImporter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportData = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Import property data from Excel files into the database
        </p>
      </div>

      <ExcelImporter />

      <div className="mt-8 flex justify-end">
        <Button onClick={() => navigate('/properties')} className="gap-2">
          View Properties
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ImportData;
