'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, UserRound, ArrowUpRight, Mail, Phone 
} from 'lucide-react';

export default function AdminDirectory() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowAttendance, setFilterLowAttendance] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setLoading(true);
        const { data: allEvents } = await supabase
      .from('events')
      .select('*, attendance_records(id)');

    let validEventCount = 0;
    if (allEvents) {
      const now = new Date();
      validEventCount = allEvents.filter(event => 
        new Date(event.date) < now || (event.attendance_records && event.attendance_records.length > 0)
      ).length;
    }
    
    setTotalEvents(validEventCount);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, attendance_records(id)')
      .order('name', { ascending: true });

    if (profiles) {
      const processed = profiles.map(p => {
        const attendedCount = p.attendance_records?.length || 0;
        let percentage = validEventCount ? Math.round((attendedCount / validEventCount) * 100) : 0;
        
        percentage = Math.min(percentage, 100);

        return { ...p, attendedCount, percentage };
      });
      setMembers(processed);
    }
    setLoading(false);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.qid.includes(searchQuery) ||
      m.uid?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAttendance = filterLowAttendance ? m.percentage < 75 : true;
    return matchesSearch && matchesAttendance;
  });

  return (
    <div className="pb-20">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-serif text-4xl mb-2 text-white drop-shadow-md">Member Directory</h2>
          <p className="text-rose-200/70">Search students, view details, and track participation.</p>
        </div>
        
        <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-4 flex gap-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
          <div className="text-center px-2">
            <p className="text-[10px] uppercase tracking-widest text-rose-200/50 mb-1">Total Members</p>
            <p className="text-xl font-serif text-white">{members.length}</p>
          </div>
          <div className="text-center px-2 border-l border-rose-500/20">
            <p className="text-[10px] uppercase tracking-widest text-rose-200/50 mb-1">Low Attendance</p>
            <p className="text-xl font-serif text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]">{members.filter(m => m.percentage < 75).length}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300/50" />
          <input 
            type="text" placeholder="Search by name, QID, or Pahal UID..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-rose-400 outline-none transition-all shadow-lg placeholder:text-rose-200/30"
          />
        </div>
        
        <button 
          onClick={() => setFilterLowAttendance(!filterLowAttendance)}
          className={`flex items-center px-6 py-4 rounded-2xl border transition-all ${filterLowAttendance ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(225,29,72,0.15)]' : 'bg-black/30 backdrop-blur-md border-rose-500/20 text-rose-200/60 hover:border-rose-400/30'}`}
        >
          <Filter className="w-5 h-5 mr-3" /> 
          {filterLowAttendance ? "Showing < 75% Attendance" : "Filter Low Attendance"}
        </button>
      </div>
      <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] overflow-x-auto shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-rose-500/10 text-[10px] font-bold tracking-widest uppercase text-rose-200/50 bg-black/20">
            <div className="col-span-3">Student Name</div>
            <div className="col-span-2">College QID</div>
            <div className="col-span-2">Pahal UID</div>
            <div className="col-span-2 text-center">Attendance %</div>
            <div className="col-span-2 text-center">Contact Info</div>
            <div className="col-span-1"></div>
          </div>

          <div className="p-2 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-rose-200/40">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p>No members found matching your search.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredMembers.map((member) => (
                  <motion.div 
                    key={member.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid grid-cols-12 gap-4 p-4 items-center rounded-xl transition-all border border-transparent hover:bg-black/20 hover:border-rose-500/10 group"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/50 border border-rose-500/20 overflow-hidden shrink-0 shadow-inner">
                        {member.profile_photo ? (
                          <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                          <UserRound className="w-full h-full p-2 text-rose-300/50" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-rose-200/50 uppercase tracking-widest">{member.branch}</p>
                      </div>
                    </div>
                    <div className="col-span-2 font-mono text-xs text-rose-200/70">{member.qid}</div>
                    <div className="col-span-2 font-mono text-xs text-rose-400 uppercase tracking-tighter font-bold drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]">{member.uid}</div>
                    <div className="col-span-2 flex flex-col items-center">
                      <div className="w-full h-1.5 bg-black/40 rounded-full max-w-[80px] mb-2 overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${member.percentage >= 75 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} 
                          style={{ width: `${member.percentage}%` }} 
                        />
                      </div>
                      <span className={`text-[11px] font-bold font-mono drop-shadow-md ${member.percentage >= 75 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {member.percentage}%
                      </span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-1 items-center">
                      <div className="flex items-center text-[10px] text-rose-200/60">
                        <Phone className="w-3 h-3 mr-1.5 opacity-50" /> {member.phone || '---'}
                      </div>
                      <div className="flex items-center text-[10px] text-rose-200/60 truncate max-w-full">
                        <Mail className="w-3 h-3 mr-1.5 opacity-50" /> <span className="truncate">{member.email?.split('@')[0]}</span>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-end">
                       <button 
                        onClick={() => router.push(`/admin/directory/${member.id}`)}
                        className="p-2 text-rose-300/50 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-all"
                        title="View Details"
                       >
                         <ArrowUpRight className="w-5 h-5" />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}