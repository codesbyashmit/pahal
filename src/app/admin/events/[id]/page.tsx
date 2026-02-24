'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { ArrowLeft, Download, Users, MapPin, Clock, CalendarDays, Loader2, ShieldAlert } from 'lucide-react';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchEventDetails(params.id as string);
    }
  }, [params.id]);

  const fetchEventDetails = async (eventId: string) => {
    setLoading(true);
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      alert('Event not found.');
      router.push('/admin/events');
      return;
    }
    setEvent(eventData);
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('created_at, profiles(id, name, qid, course, branch, phone, hosteler_status)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (rsvpData) {
      setRsvps(rsvpData);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (rsvps.length === 0) return alert("No RSVPs to export.");
    const csvData = rsvps.map((rsvp, index) => ({
      "S.No": index + 1,
      "Name": rsvp.profiles.name,
      "QID": rsvp.profiles.qid,
      "Course": rsvp.profiles.course,
      "Branch": rsvp.profiles.branch,
      "Phone": rsvp.profiles.phone,
      "Housing": rsvp.profiles.hosteler_status,
      "Attendance": "" 
    }));
    const csvString = Papa.unparse(csvData);

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RSVP_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
      </div>
    );
  }

  return (
    <div className="pb-20">
            <div className="mb-8">
        <button 
          onClick={() => router.push('/admin/events')} 
          className="flex items-center text-xs font-bold tracking-widest text-rose-300/60 hover:text-white transition-colors uppercase mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl mb-2 text-white drop-shadow-md">{event?.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-rose-200/70 font-mono">
              <span className="flex items-center"><CalendarDays className="w-3 h-3 mr-1" /> {event?.type}</span>
              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(event?.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event?.location}</span>
            </div>
          </div>
          <button 
            onClick={exportCSV}
            disabled={rsvps.length === 0}
            className="flex items-center text-xs font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV Sheet
          </button>
        </div>
      </div>

      {/*stats card*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-rose-200/50 mb-1">Total Registered</p>
            <p className="text-3xl font-serif text-white">{rsvps.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-inner">
            <Users className="w-6 h-6 text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
      </div>

      {/*rsvp datatable*/}
      <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] overflow-x-auto shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-rose-500/10 text-[10px] font-bold tracking-widest uppercase text-rose-200/50 bg-black/20">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Student Name</div>
            <div className="col-span-2">QID</div>
            <div className="col-span-3">Academics</div>
            <div className="col-span-3">Contact</div>
          </div>
          <div className="p-2 min-h-[300px]">
            {rsvps.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-48 text-rose-200/40">
                <ShieldAlert className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-sm">No members have RSVP'd for this event yet.</p>
              </div>
            ) : (
              rsvps.map((rsvp, index) => (
                <motion.div 
                  key={rsvp.profiles.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center rounded-xl transition-all border border-transparent hover:bg-black/20 hover:border-rose-500/10"
                >
                  <div className="col-span-1 text-sm font-mono text-rose-200/50">
                    {index + 1}
                  </div>
                  <div className="col-span-3">
                    <p className="font-medium text-sm text-white">{rsvp.profiles.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-rose-200/50">
                      {new Date(rsvp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="col-span-2 text-sm font-mono text-rose-100/90">
                    {rsvp.profiles.qid}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-rose-100/90">{rsvp.profiles.course}</p>
                    <p className="text-xs text-rose-200/50">{rsvp.profiles.branch}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-rose-100/90">{rsvp.profiles.phone}</p>
                    <span className="text-[10px] uppercase tracking-widest text-rose-200/60 bg-black/30 border border-rose-500/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {rsvp.profiles.hosteler_status === 'Hosteler' ? 'Hostel' : 'Day Scholar'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}