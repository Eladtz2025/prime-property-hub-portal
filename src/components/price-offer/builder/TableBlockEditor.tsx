import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TableBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const TableBlockEditor = ({ open, onClose, onSave, initialData }: TableBlockEditorProps) => {
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState<string[][]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setData(initialData.data || []);
      setRows(initialData.data?.length || 3);
      setCols(initialData.data?.[0]?.length || 3);
    } else {
      initializeTable(3, 3);
    }
  }, [initialData]);

  const initializeTable = (rowCount: number, colCount: number) => {
    const newData = Array(rowCount).fill(null).map(() => Array(colCount).fill(''));
    setData(newData);
  };

  const handleRowsChange = (newRows: number) => {
    if (newRows < 1) return;
    setRows(newRows);
    
    if (newRows > data.length) {
      const newData = [...data];
      for (let i = data.length; i < newRows; i++) {
        newData.push(Array(cols).fill(''));
      }
      setData(newData);
    } else {
      setData(data.slice(0, newRows));
    }
  };

  const handleColsChange = (newCols: number) => {
    if (newCols < 1) return;
    setCols(newCols);
    
    const newData = data.map(row => {
      if (newCols > row.length) {
        return [...row, ...Array(newCols - row.length).fill('')];
      } else {
        return row.slice(0, newCols);
      }
    });
    setData(newData);
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    const newData = [...data];
    newData[rowIdx][colIdx] = value;
    setData(newData);
  };

  const handlePasteFromExcel = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const pastedText = e.target.value;
    
    if (!pastedText.trim()) return;
    
    // Split by newlines to get rows
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    // Split each row by tabs
    const parsedData = lines.map(line => line.split('\t'));
    
    // Update state
    setData(parsedData);
    setRows(parsedData.length);
    setCols(parsedData[0]?.length || 3);
  };

  const handleSave = () => {
    onSave({
      title,
      data,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת טבלה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="table-title">שם הטבלה</Label>
            <Input
              id="table-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="דירות למכירה באזור"
            />
          </div>

          {/* Excel Paste Section */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <Label htmlFor="excel-paste">הדבק טבלה מאקסל</Label>
            <Textarea
              id="excel-paste"
              placeholder="העתק תאים מאקסל או גוגל שיטס והדבק כאן (Ctrl+V)"
              rows={6}
              dir="rtl"
              onChange={handlePasteFromExcel}
              className="mt-2 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              💡 טיפ: בחר תאים באקסל, העתק (Ctrl+C) והדבק כאן. הטבלה תעודכן אוטומטית!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rows">מספר שורות</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                value={rows}
                onChange={(e) => handleRowsChange(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="cols">מספר עמודות</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                value={cols}
                onChange={(e) => handleColsChange(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {data.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="p-1">
                        <Input
                          value={cell}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          className="text-sm"
                          placeholder={`${rowIdx + 1},${colIdx + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableBlockEditor;