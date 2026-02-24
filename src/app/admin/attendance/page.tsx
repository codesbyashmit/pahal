'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, ArrowRight, X, UserRound, RotateCcw, CheckSquare, Square } from 'lucide-react';

export default function AdminAttendanceUpload() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string, name: string } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [engineState, setEngineState] = useState<'idle' | 'parsing' | 'review' | 'uploading' | 'success'>('idle');
  
  const [expectedRsvps, setExpectedRsvps] = useState<any[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [unmatchedRecords, setUnmatchedRecords] = useState<{qid: string, name: string}[]>([]);
  
  const [finalPresentIds, setFinalPresentIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedEventId) fetchExpectedRsvps(selectedEventId);
  }, [selectedEventId]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: adminProfile } = await supabase.from('profiles').select('id, name').eq('id', session.user.id).single();
      if (adminProfile) setCurrentAdmin(adminProfile);
    }

    const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: false });
    if (eventsData) setEvents(eventsData);
    setLoading(false);
  };

  const fetchExpectedRsvps = async (eventId: string) => {
    const { data } = await supabase
      .from('event_rsvps')
      .select('profiles(id, name, qid)')
      .eq('event_id', eventId);
      
    if (data) {
      setExpectedRsvps(data.map(d => d.profiles));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setEngineState('parsing');

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, any>[];
          if (rows.length === 0) throw new Error("The CSV file is empty.");

          const headers = Object.keys(rows[0]);
          const qidKey = headers.find(h => h.toLowerCase().includes('qid'));
          const nameKey = headers.find(h => h.toLowerCase().includes('name')); 
          
          if (!qidKey) throw new Error("Could not find a column named 'QID' in the CSV.");

          const csvRecords = rows
            .map(row => ({
              qid: row[qidKey]?.toString().trim() || '',
              name: nameKey ? row[nameKey]?.toString().trim() : 'Unknown Name'
            }))
            .filter(record => record.qid.length > 0);

          const csvQids = csvRecords.map(r => r.qid);

          const { data: matchedProfiles, error } = await supabase
            .from('profiles')
            .select('id, name, qid, branch')
            .in('qid', csvQids);

          if (error) throw error;

          const foundQids = (matchedProfiles || []).map(p => p.qid);
          const unmatched = csvRecords.filter(record => !foundQids.includes(record.qid));

          setMatchedUsers(matchedProfiles || []);
          setUnmatchedRecords(unmatched); 
          
          setFinalPresentIds((matchedProfiles || []).map(p => p.id));
          
          setEngineState('review');

        } catch (err: any) {
          alert("Parsing Error: " + err.message);
          resetEngine();
        }
      },
      error: (error) => {
        alert("File Error: " + error.message);
        resetEngine();
      }
    });
  };

  const togglePresence = (userId: string) => {
    setFinalPresentIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId] 
    );
  };

  const commitAttendance = async () => {
    if (!currentAdmin || !selectedEventId || finalPresentIds.length === 0) return;
    setEngineState('uploading');

    const attendanceRecords = finalPresentIds.map(userId => ({
      event_id: selectedEventId,
      user_id: userId,
      status: 'Present'
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(attendanceRecords, { onConflict: 'event_id,user_id' });

    if (error) {
      alert("Database Error: " + error.message);
      setEngineState('review');
      return;
    }

    const eventName = events.find(e => e.id === selectedEventId)?.title || 'Unknown Event';
    await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: 'BULK_ATTENDANCE', details: `Marked ${finalPresentIds.length} members present for "${eventName}".`
    });

    setEngineState('success');
  };

  const resetEngine = () => {
    setFile(null);
    setMatchedUsers([]);
    setUnmatchedRecords([]);
    setFinalPresentIds([]);
    setEngineState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pb-20">
      <header className="mb-10">
        <h2 className="font-serif text-4xl mb-2 text-white">Bulk Attendance</h2>
        <p className="text-neutral-400">Upload CSV sheets to instantly verify and mark member presence.</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-8 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-sm font-bold tracking-widest uppercase text-neutral-400 mb-4">Step 1: Select Event</h3>
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={engineState !== 'idle'}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-rose-500 outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>-- Choose the Event/Drive --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {new Date(event.date).toLocaleDateString()} - {event.title}
                </option>
              ))}
            </select>
          </div>

          <AnimatePresence mode="wait">
            {engineState === 'idle' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center border-dashed relative group overflow-hidden max-w-4xl mx-auto">
                <input 
                  type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} disabled={!selectedEventId}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                />
                <div className={`relative z-10 flex flex-col items-center justify-center py-12 ${!selectedEventId ? 'opacity-30' : 'group-hover:scale-105 transition-transform duration-500'}`}>
                  <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                    <UploadCloud className="w-10 h-10 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-2">Upload CSV Sheet</h3>
                  <p className="text-neutral-400 max-w-sm mx-auto">
                    {!selectedEventId ? "Select an event above first." : "Drag and drop your exported Excel/CSV file here. Make sure it has a 'QID' column."}
                  </p>
                </div>
              </motion.div>
            )}

            {engineState === 'parsing' && (
              <motion.div key="parsing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-16 text-center flex flex-col items-center max-w-4xl mx-auto">
                <Loader2 className="w-12 h-12 text-rose-400 animate-spin mb-6" />
                <h3 className="text-2xl font-serif text-white mb-2">Cross-referencing Database...</h3>
                <p className="text-neutral-400">Matching QIDs against member profiles.</p>
              </motion.div>
            )}

            {engineState === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
                  <div>
                    <h3 className="text-2xl font-serif text-white flex items-center">
                      <FileSpreadsheet className="w-6 h-6 mr-3 text-emerald-400" /> Verify & Commit
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1">Manually toggle checkboxes to finalize attendance.</p>
                  </div>
                  <button onClick={resetEngine} className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 hover:text-white flex items-center bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                    <X className="w-3 h-3 mr-2" /> Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center text-emerald-400 mb-2">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span className="font-bold tracking-widest text-xs uppercase">Total Selected</span>
                    </div>
                    <p className="text-4xl font-serif text-white">{finalPresentIds.length}</p>
                    <p className="text-xs text-neutral-400 mt-2">These students will be marked present.</p>
                  </div>

                  <div className={`border rounded-2xl p-6 ${unmatchedRecords.length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`flex items-center mb-2 ${unmatchedRecords.length > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span className="font-bold tracking-widest text-xs uppercase">Unregistered / Typos</span>
                    </div>
                    <p className={`text-4xl font-serif ${unmatchedRecords.length > 0 ? 'text-white' : 'text-neutral-500'}`}>{unmatchedRecords.length}</p>
                    <p className="text-xs text-neutral-400 mt-2">Missing from database. Must create an account first.</p>
                  </div>
                </div>

                {/*sidebyside grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  
                  {/*left grid for automatic csv or excel*/}
                  <div className="bg-black/40 border border-white/5 rounded-2xl flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <h4 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                        Expected (RSVPs)
                      </h4>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
                      {expectedRsvps.length === 0 ? (
                        <p className="text-sm text-neutral-500 text-center mt-4">No RSVPs for this event.</p>
                      ) : (
                        expectedRsvps.map(user => {
                          const isSelected = finalPresentIds.includes(user.id);
                          return (
                            <div 
                              key={user.qid} 
                              className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isSelected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-black/20'}`}
                            >
                              <div>
                                <p className="text-sm text-white">{user.name}</p>
                                <p className="text-[10px] font-mono text-neutral-500">QID: {user.qid}</p>
                              </div>
                              <div className="flex items-center">
                                {isSelected ? (
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Present</span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-black/40 px-2 py-1 rounded border border-white/10">No-Show</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/*rightside with uploaded csv data*/}
                  <div className="bg-black/40 border border-white/5 rounded-2xl flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h4 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                        Actual (CSV Uploaded)
                      </h4>
                      <span className="text-[9px] text-neutral-500 uppercase tracking-widest">Click to Mark</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
                      
                      {unmatchedRecords.map((record, i) => (
                         <div key={`unmatched-${i}`} className="flex justify-between items-center p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 opacity-70 cursor-not-allowed">
                           <div>
                             <p className="text-sm text-white font-medium">{record.name}</p>
                             <p className="text-[10px] font-mono text-amber-400/70">QID: {record.qid}</p>
                           </div>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
                             Unregistered
                           </span>
                         </div>
                      ))}

                      {matchedUsers.map(user => {
                        const isSelected = finalPresentIds.includes(user.id);
                        return (
                          <div 
                            key={`matched-${user.qid}`} 
                            onClick={() => togglePresence(user.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-rose-500/50' : 'border-white/5 bg-white/5 hover:border-emerald-500/50'}`}
                          >
                            <div>
                              <p className="text-sm text-white">{user.name}</p>
                              <p className="text-[10px] font-mono text-neutral-500">QID: {user.qid}</p>
                            </div>
                            <div className="flex items-center">
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-neutral-500" />
                                )}
                              </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <button 
                  onClick={commitAttendance} 
                  disabled={finalPresentIds.length === 0}
                  className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold tracking-widest text-xs uppercase py-4 rounded-xl hover:bg-emerald-500/20 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Commit {finalPresentIds.length} Records to Database <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </motion.div>
            )}

            {engineState === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-[2rem] p-16 text-center flex flex-col items-center max-w-4xl mx-auto">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-6" />
                <h3 className="text-2xl font-serif text-white mb-2">Securing Data...</h3>
                <p className="text-neutral-400">Writing bulk attendance records to the database.</p>
              </motion.div>
            )}

            {engineState === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-16 text-center flex flex-col items-center shadow-[0_0_50px_rgba(16,185,129,0.1)] max-w-4xl mx-auto">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-2">Upload Complete.</h3>
                <p className="text-emerald-400/80 mb-8 max-w-sm">Successfully marked {finalPresentIds.length} students as present. The system audit logs have been updated.</p>
                <button onClick={resetEngine} className="text-xs font-bold tracking-widest uppercase bg-black/40 text-emerald-400 border border-emerald-500/20 px-8 py-3 rounded-full hover:bg-black/60 transition-colors flex items-center">
                  <RotateCcw className="w-4 h-4 mr-2" /> Upload Another Sheet
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}