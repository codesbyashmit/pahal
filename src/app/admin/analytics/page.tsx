'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Activity, Users } from 'lucide-react';

const COLORS = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  
  const [pulseData, setPulseData] = useState<any[]>([]);
  const [eventTypeData, setEventTypeData] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [logisticsData, setLogisticsData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('branch, hosteler_status, gender')
      .eq('status', 'approved');
    const { data: events } = await supabase
      .from('events')
      .select('title, date, type, attendance_records(id)')
      .order('date', { ascending: false });

    if (profiles) {
      setTotalMembers(profiles.length);

      const branchCounts = profiles.reduce((acc: any, p) => {
        const branch = (p.branch && p.branch !== 'NA') ? p.branch.toUpperCase() : 'OTHER';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {});
      setBranchData(Object.keys(branchCounts).map(key => ({ name: key, value: branchCounts[key] })));

      const logisticsCounts = profiles.reduce((acc: any, p) => {
        const status = p.hosteler_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setLogisticsData(Object.keys(logisticsCounts).map(key => ({ name: key, value: logisticsCounts[key] })));

      const genderCounts = profiles.reduce((acc: any, p) => {
        const gender = p.gender || 'Not Specified';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});
      setGenderData(Object.keys(genderCounts).map(key => ({ name: key, value: genderCounts[key] })));
    }

    if (events) {
      const now = new Date();
            const validEvents = events.filter(event => 
        new Date(event.date) < now || (event.attendance_records && event.attendance_records.length > 0)
      );

      const typeCounts = validEvents.reduce((acc: any, e) => {
        const type = e.type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      setEventTypeData(Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] })));

      const formattedEvents = validEvents.slice(0, 5).reverse().map(e => ({
        name: e.title.length > 12 ? e.title.substring(0, 12) + '...' : e.title,
        attendees: e.attendance_records?.length || 0
      }));
      setPulseData(formattedEvents);
    }

    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/60 backdrop-blur-xl border border-rose-500/20 p-3 rounded-xl shadow-2xl">
          <p className="text-xs text-rose-200/60 mb-1">{label || payload[0].name}</p>
          <p className="text-sm font-bold text-white">
            {payload[0].value} {payload[0].name === 'attendees' ? 'Students' : 'Members'}
          </p>
        </div>
      );
    }
    return null;
  };

  const avgAttendance = pulseData.length 
    ? Math.round(pulseData.reduce((acc, curr) => acc + curr.attendees, 0) / pulseData.length) 
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <header className="mb-10">
        <h2 className="font-serif text-4xl mb-2 text-white drop-shadow-md">Club Analytics</h2>
        <p className="text-rose-200/70">High-level insights and demographic breakdowns.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/*left column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MetricCard icon={Users} title="Total Active Members" value={totalMembers} color="text-rose-300" bg="bg-rose-500/20" border="border-rose-400/30" />
            <MetricCard icon={Activity} title="Avg. Attendance" value={avgAttendance} subtitle="Last 5 Events" color="text-emerald-300" bg="bg-emerald-500/20" border="border-emerald-400/30" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)] flex-1 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-serif text-white">Stats</h3>
              <p className="text-sm text-rose-200/50">Attendance figures for the last 5 valid events.</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pulseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#fda4af" strokeOpacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#fda4af" strokeOpacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(225,29,72,0.1)' }} />
                  <Bar dataKey="attendees" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/*right column */}
        <div className="lg:col-span-4 flex">
          <ChartCard title="Event Categories" data={eventTypeData} className="flex-1" />
        </div>

      </div>

      {/*bottom*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Branch Distribution" data={branchData} />
        <ChartCard title="Accommodation" data={logisticsData} />
        <ChartCard title="Gender Ratio" data={genderData} />
      </div>

    </div>
  );
}
function MetricCard({ icon: Icon, title, value, subtitle, color, bg, border }: any) {
  return (
    <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)] h-full">
      <div className={`p-4 rounded-2xl border ${bg} ${border} ${color} shadow-inner`}>
        <Icon className="w-8 h-8 drop-shadow-md" />
      </div>
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-rose-200/50 mb-1">{title}</p>
        <p className="text-3xl font-serif text-white">{value}</p>
        {subtitle && <p className="text-[10px] text-rose-300/40 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
function ChartCard({ title, data, className = '' }: { title: string, data: any[], className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)] flex flex-col ${className}`}>
      <h3 className="text-sm font-bold tracking-widest uppercase text-rose-200/50 mb-4 text-center">{title}</h3>
      <div className="flex-1 min-h-[200px] flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-xs text-rose-200/30">No Data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '1rem', color: '#fff' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center text-[10px] text-rose-200/70 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full mr-1.5 shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            {entry.name} ({entry.value})
          </div>
        ))}
      </div>
    </motion.div>
  );
}