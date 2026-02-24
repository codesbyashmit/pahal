'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, CheckCircle2, CalendarDays, Loader2, X } from 'lucide-react';

interface ClubEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  description: string;
}
export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<ClubEvent[]>([]);
  const [userRsvps, setUserRsvps] = useState<string[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEventsAndRSVPs();
  }, []);

  const fetchEventsAndRSVPs = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('type', ['Event', 'Campaign'])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
      return;
    }

    const now = new Date();
    const upcoming: ClubEvent[] = [];
    const past: ClubEvent[] = [];

    data?.forEach((event) => {
      if (new Date(event.date) > now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    setUpcomingEvents(upcoming);
    setPastEvents(past.reverse());
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
            <CalendarDays className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-rose-950 drop-shadow-sm">Campus Events.</h2>
        </div>
        <p className="text-rose-900/70 font-light text-sm md:text-base">Cultural fests, campaigns, and college-wide social initiatives.</p>
      </header>

      {/*upcoming events*/}
      <section className="mb-12">
        <h3 className="text-xs font-bold tracking-widest uppercase text-rose-800/60 mb-6 flex items-center">
          <Clock className="w-4 h-4 mr-2" /> Upcoming
        </h3>

        <div className="flex flex-col gap-6">
          {upcomingEvents.length === 0 ? (
            <div className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-10 text-center shadow-inner">
              <p className="text-rose-800/60 text-sm font-light">No campus events scheduled right now.</p>
            </div>
          ) : (
            <AnimatePresence>
              {upcomingEvents.map((event, index) => {
                const isRegistered = userRsvps.includes(event.id);
                const isLoading = rsvpLoading === event.id;

                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                    className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_32px_rgba(225,29,72,0.15)] relative overflow-hidden group"
                  >
                    {/*rsvp status indicator*/}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 ${
                      isRegistered ? 'bg-emerald-400/20' : 
                      event.type === 'Campaign' ? 'bg-rose-400/20' : 'bg-amber-400/20'
                    }`} />

                    <div className="relative z-10">
                      <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-4 shadow-sm ${
                          event.type === 'Campaign' ? 'border-rose-300/50 text-rose-800 bg-rose-500/10' : 'border-amber-300/50 text-amber-800 bg-amber-500/10'
                      }`}>
                        {event.type}
                      </span>
                      
                      <h4 className="text-2xl font-serif mb-2 text-rose-950">{event.title}</h4>
                      <p className="text-rose-900/80 text-sm font-light leading-relaxed mb-6 max-w-2xl">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center text-sm text-rose-900/90 bg-white/40 backdrop-blur-md p-3 rounded-xl border border-rose-200/50 shadow-sm">
                          <Clock className={`w-4 h-4 mr-3 opacity-70 ${event.type === 'Campaign' ? 'text-rose-600' : 'text-amber-600'}`} /> {formatDate(event.date)}
                        </div>
                        <div className="flex items-center text-sm text-rose-900/90 bg-white/40 backdrop-blur-md p-3 rounded-xl border border-rose-200/50 shadow-sm">
                          <MapPin className={`w-4 h-4 mr-3 opacity-70 ${event.type === 'Campaign' ? 'text-rose-600' : 'text-amber-600'}`} /> {event.location}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-rose-400/20 pt-6">
                        <div className="flex items-center text-xs text-rose-800/60 font-medium">
                          <Users className="w-4 h-4 mr-2" /> Open to all members
                        </div>
                        
                        {/*rsvp button*/}
                        <button 
                          onClick={() => handleRSVP(event.id)}
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
              })}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/*history of events*/}
      <section>
        <h3 className="text-xs font-bold tracking-widest uppercase text-rose-800/60 mb-6 flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" /> Past Events
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pastEvents.length === 0 ? (
            <div className="col-span-full bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-8 text-center shadow-inner">
              <p className="text-rose-800/60 text-sm font-light">Event history will appear here once events conclude.</p>
            </div>
          ) : (
            pastEvents.map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (index * 0.1) }}
                className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-6 hover:bg-rose-500/20 transition-colors cursor-pointer group shadow-sm"
              >
                <h4 className="text-lg font-serif mb-2 text-rose-950 group-hover:text-rose-700 transition-colors">{event.title}</h4>
                <div className="flex items-center text-xs text-rose-800/60 font-mono mb-4">
                  <Clock className="w-3 h-3 mr-2 opacity-70" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <p className="text-rose-900/70 text-sm font-light line-clamp-2 mb-4">{event.description}</p>
                
                <button className={`text-[10px] font-bold tracking-widest uppercase flex items-center transition-colors ${event.type === 'Campaign' ? 'text-rose-600 group-hover:text-rose-800' : 'text-amber-600 group-hover:text-amber-800'}`}>
                  View Gallery <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}