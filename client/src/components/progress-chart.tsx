import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface ProgressChartProps {
  data: any[];
  type: 'weight' | 'workouts' | 'measurements';
  height?: number;
}

export default function ProgressChart({ data, type, height = 300 }: ProgressChartProps) {
  const formatChartData = () => {
    if (!data || data.length === 0) {
      // Return empty state data
      return [];
    }

    switch (type) {
      case 'weight':
        return data
          .filter(entry => entry.weight)
          .map(entry => ({
            date: format(parseISO(entry.recordedAt), 'MMM dd'),
            weight: parseFloat(entry.weight),
            fullDate: entry.recordedAt,
          }))
          .reverse(); // Show most recent first

      case 'workouts':
        // Group sessions by week and count completed ones
        const weeklyData = data
          .filter(session => session.status === 'completed')
          .reduce((acc: any, session) => {
            const weekStart = format(
              subDays(parseISO(session.startedAt), new Date(session.startedAt).getDay()),
              'MMM dd'
            );
            
            if (!acc[weekStart]) {
              acc[weekStart] = { date: weekStart, workouts: 0, volume: 0 };
            }
            
            acc[weekStart].workouts += 1;
            
            // Calculate volume if exercise data is available
            if (session.exercises) {
              const sessionVolume = session.exercises.reduce((vol: number, ex: any) => {
                return vol + (ex.weight || 0) * (ex.sets || 1) * (ex.reps || 1);
              }, 0);
              acc[weekStart].volume += sessionVolume;
            }
            
            return acc;
          }, {});
        
        return Object.values(weeklyData).slice(-8); // Last 8 weeks

      case 'measurements':
        return data
          .filter(entry => entry.bodyMeasurements)
          .map(entry => {
            const measurements = entry.bodyMeasurements || {};
            return {
              date: format(parseISO(entry.recordedAt), 'MMM dd'),
              waist: measurements.waist || null,
              chest: measurements.chest || null,
              arms: measurements.arms || null,
              fullDate: entry.recordedAt,
            };
          })
          .reverse();

      default:
        return [];
    }
  };

  const chartData = formatChartData();

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-muted rounded"></div>
        </div>
        <p className="text-muted-foreground font-medium">No data available</p>
        <p className="text-sm text-muted-foreground mt-1">
          {type === 'weight' && "Start recording your weight to see progress"}
          {type === 'workouts' && "Complete workouts to see your performance"}
          {type === 'measurements' && "Add body measurements to track changes"}
        </p>
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div style={{ height }}>
        {renderEmptyState()}
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'weight':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number) => [`${value} kg`, 'Weight']}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--secondary))' }}
            />
          </LineChart>
        );

      case 'workouts':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="workouts" 
              fill="hsl(var(--primary))" 
              name="Workouts"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'measurements':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {chartData.some(d => d.waist) && (
              <Line 
                type="monotone" 
                dataKey="waist" 
                stroke="hsl(var(--primary))" 
                name="Waist (cm)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}
            {chartData.some(d => d.chest) && (
              <Line 
                type="monotone" 
                dataKey="chest" 
                stroke="hsl(var(--secondary))" 
                name="Chest (cm)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}
            {chartData.some(d => d.arms) && (
              <Line 
                type="monotone" 
                dataKey="arms" 
                stroke="hsl(var(--accent))" 
                name="Arms (cm)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}
          </LineChart>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
