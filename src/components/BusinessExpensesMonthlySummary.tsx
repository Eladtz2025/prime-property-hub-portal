import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessExpense } from '@/hooks/useBusinessExpenses';

interface Props {
  expenses: BusinessExpense[];
  agents: { id: string; full_name: string | null }[];
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const BusinessExpensesMonthlySummary = ({ expenses, agents }: Props) => {
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const currentYear = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    const filtered = filterAgent === 'all' ? expenses : expenses.filter(e => e.assigned_to === filterAgent);

    const monthlyItems = filtered.filter(e => e.frequency === 'monthly');
    const yearlyItems = filtered.filter(e => e.frequency === 'yearly');
    const oneTimeItems = filtered.filter(e => e.frequency === 'one_time');

    const totalMonthly = monthlyItems.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalYearlyPerMonth = yearlyItems.reduce((sum, e) => sum + (e.amount || 0), 0) / 12;

    return Array.from({ length: 12 }, (_, i) => {
      const oneTimeTotal = oneTimeItems
        .filter(e => new Date(e.created_at).getMonth() === i && new Date(e.created_at).getFullYear() === currentYear)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        month: MONTH_NAMES[i],
        monthly: totalMonthly,
        yearly: totalYearlyPerMonth,
        oneTime: oneTimeTotal,
        total: totalMonthly + totalYearlyPerMonth + oneTimeTotal,
      };
    });
  }, [expenses, filterAgent, currentYear]);

  const yearTotal = monthlyData.reduce((sum, m) => sum + m.total, 0);

  const fmt = (n: number) => `₪${Math.round(n).toLocaleString()}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">סיכום חודשי - {currentYear}</CardTitle>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="כל הסוכנים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוכנים</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.full_name || 'ללא שם'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>חודש</TableHead>
              <TableHead>הוצאות חודשיות</TableHead>
              <TableHead>הוצאות שנתיות (חלק חודשי)</TableHead>
              <TableHead>חד-פעמי</TableHead>
              <TableHead>סה"כ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell>{fmt(row.monthly)}</TableCell>
                <TableCell>{fmt(row.yearly)}</TableCell>
                <TableCell>{row.oneTime > 0 ? fmt(row.oneTime) : '-'}</TableCell>
                <TableCell className="font-semibold">{fmt(row.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">סה"כ שנתי</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell className="font-bold">{fmt(yearTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BusinessExpensesMonthlySummary;
