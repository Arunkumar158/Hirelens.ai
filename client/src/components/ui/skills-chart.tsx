import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface SkillsChartProps {
  matchedSkills: number;
  missingSkills: number;
}

export function SkillsChart({ matchedSkills, missingSkills }: SkillsChartProps) {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    setData([
      { name: 'Matched Skills', value: matchedSkills, color: '#10b981' }, // green-500
      { name: 'Missing Skills', value: missingSkills, color: '#ef4444' }, // red-500
    ]);
  }, [matchedSkills, missingSkills]);
  
  if (matchedSkills === 0 && missingSkills === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No skills data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} skills`, 'Count']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
