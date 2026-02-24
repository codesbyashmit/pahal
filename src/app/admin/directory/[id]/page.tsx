'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Mail, Phone, BookOpen, GraduationCap, 
  MapPin, ShieldCheck, Calendar, CheckCircle2, XCircle, MousePointerClick
} from 'lucide-react';

export default function AdminMemberDetails() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [fullHistory, setFullHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ attended: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (params.id) fetchMemberData(params.id as string);
  }, [params.id]);

  const fetchMemberData = async (userId: string) => {
    setLoading(true);
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, attendance_records(event_id, status)')
      .eq('id', userId)
      .single();
    const { data: allEvents } = await supabase
      .from('events')
      .select('*, attendance_records(id)')
      .order('date', { ascending: false });

    if (profileData && allEvents) {
      setProfile(profileData);
            const attendedMap = new Map();
      profileData.attendance_records?.forEach((r: any) => {
        attendedMap.set(r.event_id, r.status);
      });

      const now = new Date();
      const validEvents = allEvents.filter(event => 
        new Date(event.date) < now || (event.attendance_records && event.attendance_records.length > 0)
      );

      const history = validEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        status: attendedMap.has(event.id) ? attendedMap.get(event.id) : 'Absent'
      }));

      const attendedCount = history.filter(e => e.status === 'Present').length;
      const totalCount = history.length;
      const perc = totalCount ? Math.round((attendedCount / totalCount) * 100) : 0;
      
      setStats({ attended: attendedCount, total: totalCount, percentage: perc });
      setFullHistory(history);
    }
    setLoading(false);
  };

  const toggleAttendance = async (eventId: string, currentStatus: string) => {
    if (!profile) return;
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    setFullHistory(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
    setStats(prev => {
      const newAttended = newStatus === 'Present' ? prev.attended + 1 : prev.attended - 1;
      const newPerc = prev.total ? Math.round((newAttended / prev.total) * 100) : 0;
      return { ...prev, attended: newAttended, percentage: newPerc };
    });

    if (newStatus === 'Present') {
      await supabase.from('attendance_records').upsert({
        event_id: eventId,
        user_id: profile.id,
        status: 'Present'
      }, { onConflict: 'event_id,user_id' });
    } else {
      await supabase.from('attendance_records').delete().match({
        event_id: eventId,
        user_id: profile.id
      });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: admin } = await supabase.from('profiles').select('id, name').eq('id', session.user.id).single();
      if (admin) {
         await supabase.from('audit_logs').insert({
          admin_id: admin.id, admin_name: admin.name,
          action: 'MANUAL_ATTENDANCE_EDIT', details: `Changed ${profile.name}'s attendance to ${newStatus.toUpperCase()}.`
        });
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="w-10 h-10 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-20">
      <button 
        onClick={() => router.push('/admin/directory')}
        className="flex items-center text-xs font-bold tracking-widest text-rose-300/60 hover:text-rose-200 transition-colors uppercase mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/*left side*/}
        <div className="lg:col-span-4 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-3xl bg-black/50 border border-rose-500/20 overflow-hidden mb-6 shadow-inner">
                  {profile.profile_photo ? (
                    <img src={profile.profile_photo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User className="w-full h-full p-8 text-rose-300/50" />
                  )}
                </div>
                <h2 className="text-2xl font-serif text-white mb-1 drop-shadow-md">{profile.name}</h2>
                <span className="text-xs font-mono text-rose-400 tracking-widest uppercase mb-6 drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]">{profile.uid}</span>
                  <div className="w-full pt-6 border-t border-rose-500/10">
                  <div className="bg-black/30 p-4 rounded-2xl border border-rose-500/20 shadow-inner">
                    <p className="text-[10px] text-rose-200/50 uppercase tracking-widest mb-1">Overall Attendance</p>
                    <p className={`text-3xl font-serif drop-shadow-md ${stats.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>{stats.percentage}%</p>
                  </div>
                </div>
             </div>
          </motion.div>

          <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
            <h3 className="text-sm font-bold tracking-widest uppercase text-rose-200/70 mb-6 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" /> Verified Data
            </h3>
            <div className="space-y-4">
              <ProfileMeta icon={Mail} label="Email" value={profile.email} />
              <ProfileMeta icon={Phone} label="Phone" value={profile.phone || '---'} />
              <ProfileMeta icon={User} label="Gender" value={profile.gender || 'Not specified'} /> 
              <ProfileMeta icon={GraduationCap} label="Branch" value={profile.branch} />
              <ProfileMeta icon={ShieldCheck} label="College QID" value={profile.qid} />
            </div>
          </div>
        </div>

        {/*right side*/}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-serif text-white flex items-center drop-shadow-md">
                    <Calendar className="w-5 h-5 mr-3 text-rose-400" /> Participation History
                  </h3>
                  <p className="text-xs text-rose-200/50 mt-1 flex items-center">
                    <MousePointerClick className="w-3 h-3 mr-1" /> Click on event to manually override their attendance.
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-rose-200/60 bg-black/30 px-4 py-2 rounded-xl border border-rose-500/20 shadow-inner">
                  {stats.attended} / {stats.total} Events
                </span> 
             </div>

             <div className="space-y-3">
               {fullHistory.length === 0 ? (
                 <div className="py-12 text-center text-rose-200/40 border border-dashed border-rose-500/20 rounded-3xl">
                   No valid events found in the system.
                 </div>
               ) : (
                 fullHistory.map((event, i) => (
                   <motion.div 
                     key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                     onClick={() => toggleAttendance(event.id, event.status)}
                     className="flex items-center justify-between p-5 bg-black/20 border border-rose-500/10 rounded-2xl hover:bg-black/40 hover:border-rose-500/30 transition-all cursor-pointer group"
                   >
                     <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl border transition-all ${event.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                         {event.status === 'Present' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                       </div>
                       <div>
                         <h4 className="text-sm font-medium text-white">{event.title}</h4>
                         <p className="text-[10px] text-rose-200/50 uppercase tracking-widest font-mono">
                           {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.type}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] uppercase tracking-widest text-rose-300/50 opacity-0 group-hover:opacity-100 transition-opacity">Toggle</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-colors ${event.status === 'Present' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'border-rose-500/30 text-rose-400 bg-rose-500/10 shadow-[0_0_5px_rgba(244,63,94,0.2)]'}`}>
                          {event.status}
                        </span>
                     </div>
                   </motion.div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileMeta({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-black/30 rounded-xl border border-rose-500/20 shadow-inner">
        <Icon className="w-4 h-4 text-rose-300/50" />
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-rose-200/40">{label}</p>
        <p className="text-sm text-rose-100/90 font-medium">{value}</p>
      </div>
    </div>
  );
}