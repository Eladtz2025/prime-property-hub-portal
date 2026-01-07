import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface SeoHistoryEntry {
  id: string;
  page_url: string;
  page_name: string | null;
  score: number;
  checked_at: string;
}

interface SeoHistoryChartProps {
  history: SeoHistoryEntry[];
  selectedPage?: string;
}

export const SeoHistoryChart: React.FC<SeoHistoryChartProps> = ({ history, selectedPage }) => {
  // Filter by selected page if specified
  const filteredHistory = selectedPage 
    ? history.filter(h => h.page_url === selectedPage)
    : history;

  // Group by date and calculate average score per day
  const groupedByDate = filteredHistory.reduce((acc, entry) => {
    const date = format(new Date(entry.checked_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { scores: [], date };
    }
    acc[date].scores.push(entry.score);
    return acc;
  }, {} as Record<string, { scores: number[]; date: string }>);

  const chartData = Object.values(groupedByDate)
    .map(group => ({
      date: group.date,
      score: Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length),
      displayDate: format(new Date(group.date), 'd MMM', { locale: he }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  if (chartData.length < 2) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">היסטוריית ציונים</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            צריך לפחות 2 בדיקות להצגת גרף התקדמות
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const firstScore = chartData[0]?.score || 0;
  const improvement = latestScore - firstScore;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">היסטוריית ציונים</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">שיפור:</span>
            <span className={`font-bold ${improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#888' }}
                formatter={(value: number) => [value, 'ציון']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={getScoreColor(latestScore)}
                strokeWidth={2}
                dot={{ fill: getScoreColor(latestScore), strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
