import React from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ChartData {
  type: 'area' | 'bar' | 'pie';
  data: any[];
  keys: string[];
  colors?: string[];
}

interface GenerativeResponseProps {
  chartData: ChartData;
}

const DEFAULT_COLORS = ['#2aff6e', '#a855f7', '#3b82f6', '#f59e0b', '#ef4444'];

const KEY_LABELS: Record<string, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  total: 'Total',
};

export default function GenerativeResponse({ chartData }: GenerativeResponseProps) {
  const colors = chartData.colors ?? DEFAULT_COLORS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="bg-black/40 border border-white/10 rounded-xl p-4 mt-2"
    >
      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#2aff6e] rounded-full animate-pulse inline-block" />
        AI 생성 데이터 시각화
      </p>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartData.type === 'area' ? (
            <AreaChart data={chartData.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {chartData.keys.map((key, i) => (
                  <linearGradient key={key} id={`gen-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px' }}
                formatter={(val: any) => [`${Number(val).toFixed(2)} tCO₂`]}
              />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#666' }} />
              {chartData.keys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={KEY_LABELS[key] ?? key}
                  stroke={colors[i]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gen-grad-${key})`}
                />
              ))}
            </AreaChart>
          ) : chartData.type === 'bar' ? (
            <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px' }}
              />
              {chartData.keys.map((key, i) => (
                <Bar key={key} dataKey={key} name={KEY_LABELS[key] ?? key} fill={colors[i]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey={chartData.keys[0] ?? 'value'}
              >
                {chartData.data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
