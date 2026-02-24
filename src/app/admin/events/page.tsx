'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, Plus, Trash2, Clock, MapPin, Loader2, Users } from 'lucide-react';

export default function AdminEvents() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'notices'>('events');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string, name: string } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ title: '', type: 'Visit', date: '', location: '', description: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', urgency: 'normal' });
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: adminProfile } = await supabase.from('profiles').select('id, name').eq('id', session.user.id).single();
      if (adminProfile) setCurrentAdmin(adminProfile);
    }
    const [eventsRes, noticesRes] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false })
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (noticesRes.data) setNotices(noticesRes.data);
    setLoading(false);
  };
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    setIsSubmitting(true);

    const { data, error } = await supabase.from('events').insert([eventForm]).select().single();

    if (error) {
      alert(error.message);
    } else {
      setEvents([...events, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setEventForm({ title: '', type: 'Visit', date: '', location: '', description: '' });
            await supabase.from('audit_logs').insert({
        admin_id: currentAdmin.id, admin_name: currentAdmin.name,
        action: 'CREATED_EVENT', details: `Created a new ${eventForm.type}: ${eventForm.title}`
      });
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!currentAdmin || !window.confirm(`Delete event: ${title}?`)) return;

    await supabase.from('events').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));

    await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: 'DELETED_EVENT', details: `Deleted event: ${title}`
    });
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    setIsSubmitting(true);

    const { data, error } = await supabase.from('announcements').insert([noticeForm]).select().single();

    if (error) {
      alert(error.message);
    } else {
      setNotices([data, ...notices]);
      setNoticeForm({ title: '', content: '', urgency: 'normal' });
      await supabase.from('audit_logs').insert({
        admin_id: currentAdmin.id, admin_name: currentAdmin.name,
        action: 'CREATED_NOTICE', details: `Posted announcement: ${noticeForm.title}`
      });
    }
    setIsSubmitting(false);
  };
  const handleDeleteNotice = async (id: string, title: string) => {
    if (!currentAdmin || !window.confirm(`Delete notice: ${title}?`)) return;

    await supabase.from('announcements').delete().eq('id', id);
    setNotices(notices.filter(n => n.id !== id));

    await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: 'DELETED_NOTICE', details: `Deleted announcement: ${title}`
    });
  };
  return (
    <div className="pb-20">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-serif text-4xl mb-2 text-white drop-shadow-md">Manage Events</h2>
          <p className="text-rose-200/70">Publish drives, campus events, and announcements.</p>
        </div>
                <div className="flex bg-black/40 backdrop-blur-md border border-rose-500/20 rounded-xl p-1 shadow-lg w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex-1 md:flex-none flex justify-center items-center px-6 py-2 rounded-lg text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-rose-500/30 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4 mr-2" /> Events & Drives
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex-1 md:flex-none flex justify-center items-center px-6 py-2 rounded-lg text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'notices' ? 'bg-rose-500/30 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}
          >
            <Bell className="w-4 h-4 mr-2" /> Notice Board
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/*events tab*/}
          {activeTab === 'events' && (
            <motion.div key="events-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/*creation form*/}
              <div className="lg:col-span-5">
                <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-8 sticky top-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
                  <h3 className="text-xl font-serif text-white mb-6 flex items-center drop-shadow-md">
                    <Plus className="w-5 h-5 mr-2 text-rose-400" /> Create New Event
                  </h3>
                  
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <input 
                      type="text" placeholder="Event Title" required
                      value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30"
                    />
                    
                    <div className="flex gap-4">
                      <select 
                        value={eventForm.type} onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                        className="w-1/2 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                      >
                        <option value="Visit" className="bg-neutral-900 text-white">Village Visit</option>
                        <option value="Event" className="bg-neutral-900 text-white">Campus Event</option>
                        <option value="Campaign" className="bg-neutral-900 text-white">Campaign</option>
                        <option value="Meeting" className="bg-neutral-900 text-white">Meeting</option>
                      </select>
                      
                      <input 
                        type="datetime-local" required
                        value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                        className="w-1/2 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>

                    <input 
                      type="text" placeholder="Location" required
                      value={eventForm.location} onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30"
                    />

                    <textarea 
                      placeholder="Description & Details..." required rows={4}
                      value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner resize-none placeholder:text-rose-200/30"
                    />

                    <button disabled={isSubmitting} className="w-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold tracking-widest text-xs uppercase py-4 rounded-xl hover:bg-rose-500/30 transition-all flex justify-center items-center shadow-[0_0_15px_rgba(225,29,72,0.15)] disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" /> : 'Publish Event'}
                    </button>
                  </form>
                </div>
              </div>

              {/*list of event */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-6 flex justify-between group hover:bg-black/20 hover:border-rose-500/20 transition-all shadow-lg">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded border shadow-sm ${
                          event.type === 'Visit' ? 'border-blue-500/30 text-blue-300 bg-blue-500/20' : 
                          event.type === 'Meeting' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/20' : 
                          event.type === 'Event' ? 'border-amber-500/30 text-amber-300 bg-amber-500/20' : 
                          'border-rose-500/30 text-rose-300 bg-rose-500/20'
                        }`}>{event.type}</span>
                        <h4 className="text-lg font-serif text-white">{event.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-rose-200/60 font-mono mt-3">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0 h-fit">
                      <button 
                        onClick={() => router.push(`/admin/events/${event.id}`)} 
                        className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl transition-all shadow-sm"
                        title="View RSVPs"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id, event.title)} 
                        className="p-3 bg-black/30 border border-rose-500/10 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all shadow-sm"
                        title="Delete Event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                ))}
                {events.length === 0 && <p className="text-center text-rose-200/40 py-10">No events scheduled.</p>}
              </div>

            </motion.div>
          )}

          {/*notice tab*/}
          {activeTab === 'notices' && (
            <motion.div key="notices-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/*notice creation form */}
              <div className="lg:col-span-5">
                <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-8 sticky top-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
                  <h3 className="text-xl font-serif text-white mb-6 flex items-center drop-shadow-md">
                    <Plus className="w-5 h-5 mr-2 text-amber-400" /> Post Announcement
                  </h3>
                  
                  <form onSubmit={handleCreateNotice} className="space-y-4">
                    <input 
                      type="text" placeholder="Announcement Title" required
                      value={noticeForm.title} onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-amber-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30"
                    />
                    
                    <select 
                      value={noticeForm.urgency} onChange={(e) => setNoticeForm({...noticeForm, urgency: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-amber-400 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="normal" className="bg-neutral-900 text-white">Normal Priority</option>
                      <option value="high" className="bg-neutral-900 text-rose-400">Urgent</option>
                    </select>

                    <textarea 
                      placeholder="Message content..." required rows={5}
                      value={noticeForm.content} onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                      className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-amber-400 outline-none transition-all shadow-inner resize-none placeholder:text-rose-200/30"
                    />

                    <button disabled={isSubmitting} className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-widest text-xs uppercase py-4 rounded-xl hover:bg-amber-500/30 transition-all flex justify-center items-center shadow-[0_0_15px_rgba(245,158,11,0.15)] disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> : 'Post to Notice Board'}
                    </button>
                  </form>
                </div>
              </div>

              {/*notice list*/}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {notices.map((notice) => (
                  <div key={notice.id} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-6 flex justify-between group hover:bg-black/20 hover:border-rose-500/20 transition-all shadow-lg">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {notice.urgency === 'high' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />}
                        <h4 className="text-lg font-serif text-white">{notice.title}</h4>
                      </div>
                      <p className="text-sm text-rose-100/70 mb-3">{notice.content}</p>
                      <span className="text-[10px] font-mono text-rose-300/50 uppercase tracking-widest">
                        {new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteNotice(notice.id, notice.title)} className="p-3 bg-black/30 border border-rose-500/10 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all shrink-0 h-fit shadow-sm">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {notices.length === 0 && <p className="text-center text-rose-200/40 py-10">No active announcements.</p>}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
}