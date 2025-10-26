import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PriceQuoteBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const PriceQuoteBlockEditor = ({ open, onClose, onSave, initialData }: PriceQuoteBlockEditorProps) => {
  const [salePublicationMin, setSalePublicationMin] = useState('');
  const [salePublicationMax, setSalePublicationMax] = useState('');
  const [saleExpectedMin, setSaleExpectedMin] = useState('');
  const [saleExpectedMax, setSaleExpectedMax] = useState('');
  const [rentalPublicationMin, setRentalPublicationMin] = useState('');
  const [rentalPublicationMax, setRentalPublicationMax] = useState('');
  const [rentalExpectedMin, setRentalExpectedMin] = useState('');
  const [rentalExpectedMax, setRentalExpectedMax] = useState('');

  useEffect(() => {
    if (initialData) {
      setSalePublicationMin(initialData.salePublicationMin || '');
      setSalePublicationMax(initialData.salePublicationMax || '');
      setSaleExpectedMin(initialData.saleExpectedMin || '');
      setSaleExpectedMax(initialData.saleExpectedMax || '');
      setRentalPublicationMin(initialData.rentalPublicationMin || '');
      setRentalPublicationMax(initialData.rentalPublicationMax || '');
      setRentalExpectedMin(initialData.rentalExpectedMin || '');
      setRentalExpectedMax(initialData.rentalExpectedMax || '');
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({
      salePublicationMin,
      salePublicationMax,
      saleExpectedMin,
      saleExpectedMax,
      rentalPublicationMin,
      rentalPublicationMax,
      rentalExpectedMin,
      rentalExpectedMax,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת בלוק הצעת מחיר</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sale Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold text-lg">מכירה (אופציונלי)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sale-pub-min">פרסום - מינימום (₪ מיליון)</Label>
                <Input
                  id="sale-pub-min"
                  type="number"
                  step="0.01"
                  value={salePublicationMin}
                  onChange={(e) => setSalePublicationMin(e.target.value)}
                  placeholder="5.35"
                />
              </div>
              <div>
                <Label htmlFor="sale-pub-max">פרסום - מקסימום (₪ מיליון)</Label>
                <Input
                  id="sale-pub-max"
                  type="number"
                  step="0.01"
                  value={salePublicationMax}
                  onChange={(e) => setSalePublicationMax(e.target.value)}
                  placeholder="5.65"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sale-exp-min">צפי סגירה - מינימום (₪ מיליון)</Label>
                <Input
                  id="sale-exp-min"
                  type="number"
                  step="0.01"
                  value={saleExpectedMin}
                  onChange={(e) => setSaleExpectedMin(e.target.value)}
                  placeholder="5.05"
                />
              </div>
              <div>
                <Label htmlFor="sale-exp-max">צפי סגירה - מקסימום (₪ מיליון)</Label>
                <Input
                  id="sale-exp-max"
                  type="number"
                  step="0.01"
                  value={saleExpectedMax}
                  onChange={(e) => setSaleExpectedMax(e.target.value)}
                  placeholder="5.35"
                />
              </div>
            </div>
          </div>

          {/* Rental Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold text-lg">השכרה (אופציונלי)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rental-pub-min">פרסום - מינימום (₪)</Label>
                <Input
                  id="rental-pub-min"
                  type="number"
                  value={rentalPublicationMin}
                  onChange={(e) => setRentalPublicationMin(e.target.value)}
                  placeholder="9500"
                />
              </div>
              <div>
                <Label htmlFor="rental-pub-max">פרסום - מקסימום (₪)</Label>
                <Input
                  id="rental-pub-max"
                  type="number"
                  value={rentalPublicationMax}
                  onChange={(e) => setRentalPublicationMax(e.target.value)}
                  placeholder="10500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rental-exp-min">צפי סגירה - מינימום (₪)</Label>
                <Input
                  id="rental-exp-min"
                  type="number"
                  value={rentalExpectedMin}
                  onChange={(e) => setRentalExpectedMin(e.target.value)}
                  placeholder="9000"
                />
              </div>
              <div>
                <Label htmlFor="rental-exp-max">צפי סגירה - מקסימום (₪)</Label>
                <Input
                  id="rental-exp-max"
                  type="number"
                  value={rentalExpectedMax}
                  onChange={(e) => setRentalExpectedMax(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            ניתן למלא רק מכירה, רק השכרה, או את שניהם. שדות ריקים לא יוצגו בהצעת המחיר.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceQuoteBlockEditor;