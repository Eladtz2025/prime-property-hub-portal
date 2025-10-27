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
          <div 
            key={rowIndex} 
            className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-3"
          >
            {/* First Row: Address + Price */}
            <div className="flex justify-between items-start gap-3 pb-3 border-b border-border/50">
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {headers[0]}
                </div>
                <div className="text-base font-bold text-foreground">
                  {row[0]}
                </div>
              </div>
              {row.length > 1 && (
                <div className="text-left">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {headers[1]}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {row[1]}
                  </div>
                </div>
              )}
            </div>

            {/* Grid for middle parameters (skip first 2 and last) */}
            {row.length > 3 && (
              <div className="space-y-3">
                {/* Find parking and elevator indices */}
                {(() => {
                  const parkingIndex = headers.findIndex(h => h.toLowerCase().includes('חניה') || h.toLowerCase().includes('parking'));
                  const elevatorIndex = headers.findIndex(h => h.toLowerCase().includes('מעלית') || h.toLowerCase().includes('elevator'));
                  const middleParams = row.slice(2, -1);
                  const middleHeaders = headers.slice(2, -1);
                  
                  // Separate parking/elevator from other params
                  const parkingElevatorIndices = new Set([parkingIndex - 2, elevatorIndex - 2]);
                  const otherParams: Array<{value: string, header: string, idx: number}> = [];
                  const parkingElevatorParams: Array<{value: string, header: string}> = [];
                  
                  middleParams.forEach((cell, idx) => {
                    const actualIdx = idx + 2;
                    if (parkingElevatorIndices.has(idx)) {
                      parkingElevatorParams.push({ value: cell, header: headers[actualIdx] });
                    } else {
                      otherParams.push({ value: cell, header: headers[actualIdx], idx: actualIdx });
                    }
                  });
                  
                  return (
                    <>
                      {/* Other parameters in 2-column grid */}
                      {otherParams.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {otherParams.map((param) => (
                            <div key={param.idx} className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                {param.header}
                              </div>
                              <div className="text-sm font-semibold text-foreground">
                                {param.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Parking & Elevator in same row */}
                      {parkingElevatorParams.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {parkingElevatorParams.map((param, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                {param.header}
                              </div>
                              <div className="text-sm font-semibold text-foreground">
                                {param.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Last Row: Full width for long values (like renovation level) */}
            {row.length > 2 && (
              <div className="pt-3 border-t border-border/50">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {headers[row.length - 1]}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {row[row.length - 1]}
                </div>
              </div>
            )}

            {rowIndex < rows.length - 1 && (
              <div className="border-b border-border/30 mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceOfferTable;
