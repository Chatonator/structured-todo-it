import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { TrendPoint } from '@/hooks/view-data/useObservatoryViewData';

interface CompletionChartProps {
  data: TrendPoint[];
}

export const CompletionChart: React.FC<CompletionChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Tendance (14 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="top" 
                height={24}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">
                    {value === 'completed' ? 'Complétées' : 'Créées'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCreated)"
                name="created"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionChart;
