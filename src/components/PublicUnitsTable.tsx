import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface PublicProjectUnit {
  id: string;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  price: number | null;
  unit_type: string | null;
  status: string;
}

interface PublicUnitsTableProps {
  units: PublicProjectUnit[];
  language: "he" | "en";
}

const statusConfig: Record<string, { he: string; en: string; className: string }> = {
  available: { he: "זמין", en: "Available", className: "text-emerald-400 font-semibold" },
  sold: { he: "נמכר", en: "Sold", className: "text-red-400/70" },
  reserved: { he: "שמור", en: "Reserved", className: "text-amber-400" },
};

const labels = {
  he: { floor: "קומה", rooms: "חדרים", size: 'מ"ר', type: "סוג", price: "מחיר", status: "סטטוס", currency: "₪" },
  en: { floor: "Floor", rooms: "Rooms", size: "sqm", type: "Type", price: "Price", status: "Status", currency: "₪" },
};

function formatPrice(price: number, currency: string): string {
  return `${currency} ${price.toLocaleString("he-IL")}`;
}

export const PublicUnitsTable = ({ units, language }: PublicUnitsTableProps) => {
  const l = labels[language];
  if (units.length === 0) return null;

  return (
    <div className="w-full overflow-auto max-h-[280px] rounded border border-white/10">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.type}</TableHead>
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.rooms}</TableHead>
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.size}</TableHead>
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.floor}</TableHead>
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.price}</TableHead>
            <TableHead className="text-white/60 text-xs h-8 px-2">{l.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => {
            const st = statusConfig[unit.status] || statusConfig.available;
            const isSold = unit.status === "sold";
            return (
              <TableRow key={unit.id} className={`border-white/5 hover:bg-white/5 ${isSold ? "opacity-50" : ""}`}>
                <TableCell className="text-white/80 text-xs py-1.5 px-2">{unit.unit_type || "—"}</TableCell>
                <TableCell className="text-white/80 text-xs py-1.5 px-2">{unit.rooms ?? "—"}</TableCell>
                <TableCell className="text-white/80 text-xs py-1.5 px-2">{unit.size ?? "—"}</TableCell>
                <TableCell className="text-white/80 text-xs py-1.5 px-2">{unit.floor ?? "—"}</TableCell>
                <TableCell className={`text-xs py-1.5 px-2 ${isSold ? "line-through text-white/40" : "text-[#c8a45a]"}`}>
                  {unit.price ? formatPrice(unit.price, l.currency) : "—"}
                </TableCell>
                <TableCell className={`text-xs py-1.5 px-2 ${st.className}`}>
                  {st[language]}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export function getUnitsSummary(units: PublicProjectUnit[]) {
  const total = units.length;
  const available = units.filter(u => u.status === "available").length;
  const prices = units.filter(u => u.price && u.status !== "sold").map(u => u.price!);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  return { total, available, minPrice, maxPrice };
}
