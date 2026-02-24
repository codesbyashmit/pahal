'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface AttendanceStats {
  overall: { attended: number; total: number };
  categories: { name: string; attended: number; total: number; color: string; bg: string; border: string; text: string }[];
  history: { id: string; event: string; date: string; status: 'Present' | 'Absent' }[];
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    fetchRealAttendance();
  }, []);

  const fetchRealAttendance = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    const { data: allPastEvents } = await supabase
      .from('events')
      .select('*')
      .lt('date', new Date().toISOString())
      .order('date', { ascending: false });

    const { data: presentLogs } = await supabase
      .from('attendance')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'Present');

    if (allPastEvents) {
      const attendedIds = new Set(presentLogs?.map(log => log.event_id) || []);
      
      const cats = [
        { name: 'Village Visits', type: 'Visit', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-400' },
        { name: 'Campus Events', type: 'Event', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-400' },
        { name: 'Meetings', type: 'Meeting', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-400' },
        { name: 'Campaigns', type: 'Campaign', color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-400' },
      ];

      const categoryBreakdown = cats.map(c => {
        const totalInCat = allPastEvents.filter(e => e.type === c.type).length;
        const attendedInCat = allPastEvents.filter(e => e.type === c.type && attendedIds.has(e.id)).length;
        return { ...c, attended: attendedInCat, total: totalInCat };
      });

      const historyLog = allPastEvents.slice(0, 10).map(e => ({
        id: e.id,
        event: e.title,
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        status: attendedIds.has(e.id) ? 'Present' : 'Absent' as 'Present' | 'Absent'
      }));

      setStats({
        overall: { attended: attendedIds.size, total: allPastEvents.length },
        categories: categoryBreakdown,
        history: historyLog
      });
    }
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  const overallPercentage = stats.overall.total > 0 
    ? Math.round((stats.overall.attended / stats.overall.total) * 100) 
    : 0;

  const pieData = [
    { name: 'Attended', value: stats.overall.attended },
    { name: 'Missed', value: stats.overall.total - stats.overall.attended },
  ];
  
  const pieColors = ['#f43f5e', 'rgba(225, 29, 72, 0.1)']; 

  return (
    <div className="flex flex-col pb-20 text-rose-950">
      <header className="mb-10 lg:mt-2">
        <h2 className="font-serif text-3xl md:text-4xl mb-2 text-rose-950 drop-shadow-sm">My Attendance.</h2>
        <p className="text-rose-900/70 font-light text-sm md:text-base">Track your participation across all Pahal initiatives.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/*donat chart of aggregate*/}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-[0_8px_32px_rgba(225,29,72,0.1)] relative overflow-hidden"
        >
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-rose-800/60 mb-6 absolute top-8 left-8">Aggregate Score</h3>
          
          <div className="w-full h-64 mt-8 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={80} outerRadius={100}
                  stroke="none" paddingAngle={5}
                  dataKey="value" cornerRadius={10}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-serif text-rose-950">{overallPercentage}%</span>
              <span className="text-[10px] text-rose-800/50 font-bold uppercase tracking-[0.2em] mt-1">Present</span>
            </div>
          </div>
          
          <div className="flex gap-8 mt-4 border-t border-rose-400/20 pt-6 w-full justify-center">
             <div className="text-center">
               <p className="text-2xl font-mono font-bold text-rose-950">{stats.overall.attended}</p>
               <p className="text-[9px] font-bold uppercase tracking-widest text-rose-800/60">Attended</p>
             </div>
             <div className="w-px bg-rose-400/20" />
             <div className="text-center">
               <p className="text-2xl font-mono font-bold text-rose-950">{stats.overall.total}</p>
               <p className="text-[9px] font-bold uppercase tracking-widest text-rose-800/60">Total Events</p>
             </div>
          </div>
        </motion.div>

        {/*breakdown of catergories*/}
        <div className="grid grid-cols-2 gap-4">
          {stats.categories.map((cat, index) => {
            const percentage = cat.total > 0 ? Math.round((cat.attended / cat.total) * 100) : 0;
            return (
              <motion.div 
                key={cat.name}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                className={`backdrop-blur-lg border rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between ${cat.bg} ${cat.border}`}
              >
                <h4 className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${cat.text}`}>{cat.name}</h4>
                
                <div className="flex items-end justify-between mb-4">
                  <span className="text-4xl font-serif text-rose-950">{percentage}%</span>
                  <span className="text-[10px] font-bold text-rose-800/50 mb-1">{cat.attended}/{cat.total}</span>
                </div>

                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/*recent history */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-8 shadow-sm"
      >
        <h3 className="text-xl font-serif mb-6 flex items-center text-rose-950">
          <Clock className="w-5 h-5 mr-3 text-rose-500" /> Recent History
        </h3>
        <div className="flex flex-col gap-3">
          {stats.history.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/30 border border-rose-200/50 hover:bg-white/50 transition-all group shadow-sm">
              <div>
                <p className="text-sm font-bold text-rose-950">{record.event}</p>
                <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-rose-800/40 mt-1">{record.date}</p>
              </div>
              <div className="flex items-center">
                {record.status === 'Present' ? (
                  <span className="flex items-center text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Present
                  </span>
                ) : (
                  <span className="flex items-center text-[10px] font-bold tracking-widest uppercase text-rose-800/50 bg-white/40 px-4 py-1.5 rounded-full border border-rose-200/50">
                    <XCircle className="w-3.5 h-3.5 mr-2" /> Absent
                  </span>
                )}
              </div>
            </div>
          ))}
          {stats.history.length === 0 && (
            <p className="text-center text-rose-800/40 py-10 font-light">No attendance records found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}