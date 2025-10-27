import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PriceOfferTableProps {
  title?: string;
  data: string[][];
}

const PriceOfferTable = ({ title, data }: PriceOfferTableProps) => {
  if (!data || data.length === 0) return null;

  const headers = data[0];
  const rows = data.slice(1);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
      {title && (
        <div className="bg-muted px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden p-4 space-y-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="space-y-3">
            {row.map((cell, cellIndex) => (
              <div 
                key={cellIndex} 
                className="bg-muted/50 rounded-lg p-3 border border-border/50 shadow-sm"
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {headers[cellIndex]}
                </div>
                <div className="text-base font-semibold text-foreground">
                  {cell}
                </div>
              </div>
            ))}
            {rowIndex < rows.length - 1 && (
              <div className="border-b border-border/30 pt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceOfferTable;
