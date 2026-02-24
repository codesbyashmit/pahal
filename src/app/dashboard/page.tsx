'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, ArrowRight, Clock, Users, ArrowLeft, Loader2, CheckCircle2, X } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [mobileTab, setMobileTab] = useState<'feed' | 'notices'>('feed');
  
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [userRsvps, setUserRsvps] = useState<string[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; 
      
      setCurrentUserId(session.user.id);

      const [profileRes, eventsRes, announcementsRes, rsvpsRes] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', session.user.id).single(),
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('event_rsvps').select('event_id').eq('user_id', session.user.id)
      ]);

      if (profileRes.data) setUserName(profileRes.data.name.split(' ')[0]);
      setEvents(eventsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      if (rsvpsRes.data) setUserRsvps(rsvpsRes.data.map(r => r.event_id));
    };
    fetchDashboardData();
  }, []);

  const handleRSVP = async (eventId: string) => {
    if (!currentUserId) return;
    setRsvpLoading(eventId); 

    const isAlreadyRegistered = userRsvps.includes(eventId);

    if (isAlreadyRegistered) {
      const { error } = await supabase.from('event_rsvps').delete().match({ event_id: eventId, user_id: currentUserId });
      if (!error) setUserRsvps(userRsvps.filter(id => id !== eventId));
    } else {
      const { error } = await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: currentUserId });
      if (!error) setUserRsvps([...userRsvps, eventId]);
    }

    setRsvpLoading(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-9 gap-8 relative text-rose-950 font-sans">
      
      {/*header on mobile*/}
      <div className="lg:hidden col-span-1 flex flex-col mb-2">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push('/')} className="flex items-center text-[10px] font-bold tracking-widest text-rose-800 hover:text-rose-950 transition-colors uppercase border border-rose-400/30 bg-rose-500/10 px-4 py-2 rounded-full backdrop-blur-md">
            <ArrowLeft className="w-3 h-3 mr-2" /> Public Site
          </button>
        </div>
        <div className="flex p-1 bg-rose-500/10 backdrop-blur-md rounded-full border border-rose-400/30">
          <button onClick={() => setMobileTab('feed')} className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-full transition-all ${mobileTab === 'feed' ? 'bg-rose-500/20 text-rose-950 border border-rose-400/40 shadow-inner' : 'text-rose-900/60 hover:text-rose-900'}`}>
            Feed
          </button>
          <button onClick={() => setMobileTab('notices')} className={`flex-1 flex items-center justify-center py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-full transition-all ${mobileTab === 'notices' ? 'bg-rose-500/20 text-rose-950 border border-rose-400/40 shadow-inner' : 'text-rose-900/60 hover:text-rose-900'}`}>
            Notice Board
            {announcements.length > 0 && mobileTab !== 'notices' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-2 animate-pulse" />}
          </button>
        </div>
      </div>

      {/*middle */}
      <main className={`lg:col-span-6 flex-col ${mobileTab === 'feed' ? 'flex' : 'hidden lg:flex'}`}>
        <header className="mb-8 lg:mt-2">
          <h2 className="font-serif text-3xl md:text-4xl mb-2 text-rose-950 drop-shadow-sm">Welcome, {userName}.</h2>
          <p className="text-rose-900/70 text-sm md:text-base font-light">Here is what is happening across the club.</p>
        </header>

        <div className="flex flex-col gap-6">
          {events.length === 0 ? (
            <div className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-12 text-center shadow-[0_8px_32px_rgba(225,29,72,0.15)]">
              <Users className="w-12 h-12 text-rose-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-serif text-rose-950 mb-2">No Upcoming Events</h3>
              <p className="text-rose-900/60 text-sm font-light">When the core team schedules a visit or meeting, it will appear here.</p>
            </div>
          ) : (
            <AnimatePresence>
              {events.map((event, index) => {
                const isPast = new Date(event.date) < new Date();
                const isRegistered = userRsvps.includes(event.id);
                const isLoading = rsvpLoading === event.id;

                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                    className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 md:p-8 hover:bg-rose-500/20 transition-all group shadow-[0_8px_32px_rgba(225,29,72,0.15)] relative overflow-hidden"
                  >
                    {isRegistered && !isPast && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700" />
                    )}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border shadow-sm ${
                          event.type === 'Visit' ? 'border-blue-300/50 text-blue-800 bg-blue-500/10' : 
                          event.type === 'Meeting' ? 'border-emerald-300/50 text-emerald-800 bg-emerald-500/10' : 
                          event.type === 'Event' ? 'border-amber-300/50 text-amber-800 bg-amber-500/10' : 
                          'border-rose-400/50 text-rose-800 bg-rose-500/10'
                        }`}>
                          {event.type}
                        </span>
                        <div className={`flex items-center text-[10px] md:text-xs font-mono px-3 py-1.5 rounded-full border shadow-sm ${isPast ? 'bg-red-500/10 border-red-400/30 text-red-700' : 'bg-rose-500/10 border-rose-400/30 text-rose-900'}`}>
                          <Clock className="w-3 h-3 mr-2 opacity-70" /> {formatDate(event.date)}
                        </div>
                      </div>

                      <h3 className="text-xl md:text-2xl font-serif mb-3 text-rose-950">{event.title}</h3>
                      <p className="text-rose-900/80 text-sm leading-relaxed mb-8 font-light">{event.description}</p>
                      
                      <div className="flex items-center justify-between border-t border-rose-400/20 pt-6 mt-auto">
                        <div className="flex items-center text-xs md:text-sm text-rose-900 font-medium">
                          <MapPin className="w-4 h-4 mr-2 text-rose-600 shrink-0" /> 
                          <span className="truncate max-w-[150px] md:max-w-none">{event.location}</span>
                        </div>
                        
                        {isPast ? (
                          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-rose-900/60 px-4 py-2.5 border border-rose-400/30 rounded-xl bg-rose-500/10 shadow-inner">
                            Event Ended
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleRSVP(event.id)}
                            disabled={isLoading}
                            className={`text-[10px] md:text-xs font-bold tracking-widest uppercase px-4 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center transition-all shadow-sm disabled:opacity-50 ${
                              isRegistered 
                                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-400/30 hover:bg-rose-500/20 hover:text-rose-800 hover:border-rose-400/40 group/btn' 
                                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_4px_15px_rgba(225,29,72,0.3)] border border-rose-500'
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isRegistered ? (
                              <>
                                <span className="group-hover/btn:hidden flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 md:mr-2" /> Registered</span>
                                <span className="hidden group-hover/btn:flex items-center"><X className="w-4 h-4 mr-1 md:mr-2" /> Cancel</span>
                              </>
                            ) : (
                              <>RSVP <ArrowRight className="w-4 h-4 ml-1 md:ml-2" /></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/*right column*/}
      <aside className={`lg:col-span-3 flex-col h-full lg:sticky lg:top-8 ${mobileTab === 'notices' ? 'flex' : 'hidden lg:flex'}`}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 shadow-[0_8px_32px_rgba(225,29,72,0.15)]">
          <div className="flex items-center mb-6 border-b border-rose-400/20 pb-4">
            <Bell className="w-5 h-5 text-rose-600 mr-3" />
            <h3 className="font-serif text-xl text-rose-950">Notice Board</h3>
          </div>
          <div className="flex flex-col gap-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-rose-900/60 text-center py-4 font-light">No new announcements.</p>
            ) : (
              announcements.map((notice) => (
                <div key={notice.id} className="bg-rose-500/10 p-4 rounded-2xl border border-rose-400/20 hover:bg-rose-500/20 transition-colors shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-rose-950">{notice.title}</h4>
                    {notice.urgency === 'high' && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.6)] animate-pulse shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-rose-900/80 leading-relaxed mb-3 font-light">{notice.content}</p>
                  <p className="text-[9px] text-rose-700/70 uppercase tracking-widest font-mono font-bold">{formatDate(notice.created_at)}</p>
                </div>
              ))
            )}
          </div>
          
          <button onClick={() => router.push('/dashboard/resources')} className="w-full mt-6 py-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-xs font-bold tracking-widest uppercase text-rose-800 hover:text-rose-950 hover:bg-rose-500/20 transition-all shadow-sm">
            View All Resources
          </button>
        </motion.div>
      </aside>

    </div>
  );
}