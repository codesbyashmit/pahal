'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, CheckCircle2, Navigation, Loader2, X } from 'lucide-react';

interface ClubEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  description: string;
}

export default function DrivesPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [upcomingDrives, setUpcomingDrives] = useState<ClubEvent[]>([]);
  const [pastDrives, setPastDrives] = useState<ClubEvent[]>([]);
  const [userRsvps, setUserRsvps] = useState<string[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDrivesAndRSVPs();
  }, []);

  const fetchDrivesAndRSVPs = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .eq('type', 'Visit')
      .order('date', { ascending: true });

    if (!error && eventsData) {
      const now = new Date();
      const upcoming: ClubEvent[] = [];
      const past: ClubEvent[] = [];

      eventsData.forEach((event) => {
        if (new Date(event.date) > now) upcoming.push(event);
        else past.push(event);
      });

      setUpcomingDrives(upcoming);
      setPastDrives(past.reverse());
    }

    if (session) {
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', session.user.id);
        
      if (rsvpData) {
        setUserRsvps(rsvpData.map(r => r.event_id));
      }
    }

    setLoading(false);
  };

  const handleRSVP = async (eventId: string) => {
    if (!currentUserId) return;
    setRsvpLoading(eventId); 

    const isAlreadyRegistered = userRsvps.includes(eventId);

    if (isAlreadyRegistered) {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .match({ event_id: eventId, user_id: currentUserId });

      if (!error) {
        setUserRsvps(userRsvps.filter(id => id !== eventId));
      } else {
        alert("Could not cancel RSVP.");
      }
    } else {
      const { error } = await supabase
        .from('event_rsvps')
        .insert({ event_id: eventId, user_id: currentUserId });

      if (!error) {
        setUserRsvps([...userRsvps, eventId]);
      } else {
        alert("Could not complete RSVP.");
      }
    }

    setRsvpLoading(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-rose-300 border-t-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20 font-sans text-rose-950">
      
      <header className="mb-10 lg:mt-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500/10 border border-rose-400/30 rounded-xl shadow-sm backdrop-blur-md">
            <Navigation className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-rose-950 drop-shadow-sm">Village Drives.</h2>
        </div>
        <p className="text-rose-900/70 font-light text-sm md:text-base">Join our weekend missions to educate and uplift local communities.</p>
      </header>

      {/*upcoming drives*/}
      <section className="mb-12">
        <h3 className="text-xs font-bold tracking-widest uppercase text-rose-800/60 mb-6 flex items-center">
          <Clock className="w-4 h-4 mr-2" /> Upcoming Events
        </h3>

        <div className="flex flex-col gap-6">
          {upcomingDrives.length === 0 ? (
            <div className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-10 text-center shadow-inner">
              <p className="text-rose-800/60 text-sm font-light">No upcoming drives scheduled at the moment.</p>
            </div>
          ) : (
            upcomingDrives.map((drive, index) => {
              const isRegistered = userRsvps.includes(drive.id);
              const isLoading = rsvpLoading === drive.id;

              return (
                <motion.div 
                  key={drive.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                  className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_32px_rgba(225,29,72,0.15)] relative overflow-hidden group"
                >
                  {/*glow, blue for normal, green for confirm*/}
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 ${isRegistered ? 'bg-emerald-400/20' : 'bg-blue-400/20'}`} />

                  <div className="relative z-10">
                    <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-blue-300/50 text-blue-800 bg-blue-500/10 mb-4 shadow-sm">
                      Scheduled
                    </span>
              
                    <h4 className="text-2xl font-serif mb-2 text-rose-950">{drive.title}</h4>
                    <p className="text-rose-900/80 text-sm font-light leading-relaxed mb-6 max-w-2xl">{drive.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center text-sm text-rose-900/90 bg-white/40 backdrop-blur-md p-3 rounded-xl border border-rose-200/50 shadow-sm">
                        <Clock className="w-4 h-4 mr-3 text-blue-600 opacity-70" /> {formatDate(drive.date)}
                      </div>
                      <div className="flex items-center text-sm text-rose-900/90 bg-white/40 backdrop-blur-md p-3 rounded-xl border border-rose-200/50 shadow-sm">
                        <MapPin className="w-4 h-4 mr-3 text-blue-600 opacity-70" /> {drive.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-rose-400/20 pt-6">
                      <div className="flex items-center text-xs text-rose-800/60 font-medium">
                      </div>
                      
                      {/*button for rsvp*/}
                      <button 
                        onClick={() => handleRSVP(drive.id)}
                        disabled={isLoading}
                        className={`text-[10px] md:text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl flex items-center transition-all shadow-sm disabled:opacity-50 ${
                          isRegistered 
                            ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-400/30 hover:bg-rose-500/20 hover:text-rose-800 hover:border-rose-400/40 group/btn' 
                            : 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_4px_15px_rgba(225,29,72,0.3)] border border-rose-500'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRegistered ? (
                          <>
                            <span className="group-hover/btn:hidden flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Registered</span>
                            <span className="hidden group-hover/btn:flex items-center"><X className="w-4 h-4 mr-2" /> Cancel RSVP</span>
                          </>
                        ) : (
                          <>RSVP Now <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                      </button>

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/*past drives */}
      <section>
        <h3 className="text-xs font-bold tracking-widest uppercase text-rose-800/60 mb-6 flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" /> History
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pastDrives.length === 0 ? (
            <div className="col-span-full bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-8 text-center shadow-inner">
              <p className="text-rose-800/60 text-sm font-light">Drive history will appear here once events conclude.</p>
            </div>
          ) : (
            pastDrives.map((drive, index) => (
              <motion.div key={drive.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (index * 0.1) }} className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-6 hover:bg-rose-500/20 transition-colors cursor-pointer group shadow-sm">
                <h4 className="text-lg font-serif mb-2 text-rose-950 group-hover:text-rose-700 transition-colors">{drive.title}</h4>
                <div className="flex items-center text-xs text-rose-800/60 font-mono mb-4">
                  <Clock className="w-3 h-3 mr-2 opacity-70" /> {new Date(drive.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <p className="text-rose-900/70 text-sm font-light line-clamp-2 mb-4">{drive.description}</p>
              </motion.div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}