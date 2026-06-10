import { ExcelImporter } from '@/components/ExcelImporter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportData = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ייבוא נתונים</h1>
        <p className="text-muted-foreground">
          ייבוא נתוני נכסים מקובצי אקסל למערכת
        </p>
      </div>

      <ExcelImporter />

      <div className="mt-8 flex justify-end">
        <Button onClick={() => navigate('/admin-dashboard/properties')} className="gap-2">
          לרשימת הנכסים
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ImportData;
