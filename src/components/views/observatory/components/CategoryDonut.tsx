import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryStat } from '@/hooks/view-data/useObservatoryViewData';
import { TaskCategory, CATEGORY_DISPLAY_NAMES } from '@/types/task';

interface CategoryDonutProps {
  data: CategoryStat[];
  totalActive: number;
}

const FALLBACK_COLORS: Record<TaskCategory, string> = {
  Obligation: '#ef4444',
  Quotidien: '#eab308',
  Envie: '#22c55e',
  Autres: '#3b82f6',
};

export const CategoryDonut: React.FC<CategoryDonutProps> = ({ data, totalActive }) => {
  const chartData = data.filter(d => d.count > 0).map(d => ({
    name: CATEGORY_DISPLAY_NAMES[d.category],
    value: d.count,
    category: d.category,
    percentage: d.percentage,
  }));

  const getColor = (category: TaskCategory): string => {
    try {
      const root = document.documentElement;
      const cssVarName = `--category-${category.toLowerCase()}`;
      const cssVar = getComputedStyle(root).getPropertyValue(cssVarName).trim();
      if (cssVar) return `hsl(${cssVar})`;
    } catch {}
    return FALLBACK_COLORS[category];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieIcon className="h-4 w-4 text-primary" />
          Répartition par catégorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(entry.category)}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} tâche${value > 1 ? 's' : ''} (${props.payload.percentage}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune tâche active
            </div>
          )}

          {chartData.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalActive}</div>
                <div className="text-xs text-muted-foreground">actives</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {data.map(item => (
            <div key={item.category} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getColor(item.category) }}
              />
              <span className="text-xs text-muted-foreground">
                {CATEGORY_DISPLAY_NAMES[item.category]} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryDonut;
