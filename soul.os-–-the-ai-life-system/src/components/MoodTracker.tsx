import React from 'react';
import { Heart, TrendingUp, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirebase } from '../hooks/useFirebase';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function MoodTracker() {
  const { moodLogs } = useFirebase();

  const getMoodColor = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes('happy') || m.includes('joy')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (m.includes('sad') || m.includes('depressed')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (m.includes('stress') || m.includes('anxious')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (m.includes('motivate') || m.includes('excite')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
  };

  const chartData = [...moodLogs].reverse().map(log => ({
    time: format(new Date(log.timestamp), 'HH:mm'),
    intensity: log.intensity || 5,
    mood: log.mood
  }));

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden">
        <div className="scanline" />
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <Activity className="text-red-400" size={28} />
              Emotional Pulse
            </h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">Neural resonance mapping active</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Stability: High</span>
          </div>
        </div>

        <div className="h-[300px] w-full mb-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#ffffff40" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#ffffff40" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 10]}
                tick={{ fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                itemStyle={{ color: '#22d3ee' }}
              />
              <Area 
                type="monotone" 
                dataKey="intensity" 
                stroke="#22d3ee" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIntensity)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moodLogs.map((log, i) => (
            <motion.div
              key={log.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl border ${getMoodColor(log.mood)}`}>
                  <Heart size={20} />
                </div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} />
                  {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-white capitalize mb-1">{log.mood}</h3>
              {log.trigger && (
                <p className="text-xs text-white/40 italic mb-4 line-clamp-2 leading-relaxed">"{log.trigger}"</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                  <span>Intensity</span>
                  <span>{log.intensity}/10</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(log.intensity || 5) * 10}%` }}
                    className="h-full bg-white/20 group-hover:bg-cyan-400/50 transition-colors" 
                  />
                </div>
              </div>
            </motion.div>
          ))}
          {moodLogs.length === 0 && (
            <div className="col-span-full text-center py-20 opacity-20">
              <Heart size={64} className="mx-auto mb-6 animate-pulse" />
              <p className="text-xl font-black tracking-tighter">Awaiting emotional resonance data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
