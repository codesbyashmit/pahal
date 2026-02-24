'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BookOpen, Download, ExternalLink, Calendar, AlertCircle, FileText } from 'lucide-react';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'notices' | 'syllabus'>('notices');
  const [loading, setLoading] = useState(true);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [syllabusFiles, setSyllabusFiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [announcementsRes, syllabusRes] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('site_syllabus').select('*').order('created_at', { ascending: false })
      ]);

      if (announcementsRes.data) setAnnouncements(announcementsRes.data);
      if (syllabusRes.data) setSyllabusFiles(syllabusRes.data);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
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
            <BookOpen className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-rose-950 drop-shadow-sm">Resource Center.</h2>
        </div>
        <p className="text-rose-900/70 font-light text-sm md:text-base">Official announcements and academic materials.</p>
      </header>

      {/*toggle */}
      <div className="flex bg-rose-500/10 backdrop-blur-md rounded-2xl border border-rose-400/30 p-1.5 w-full md:w-fit mb-8 shadow-sm">
        <button 
          onClick={() => setActiveTab('notices')} 
          className={`flex-1 md:flex-none flex items-center justify-center px-6 py-3 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all ${
            activeTab === 'notices' 
              ? 'bg-rose-500/20 text-rose-950 border border-rose-400/40 shadow-inner' 
              : 'text-rose-900/60 hover:text-rose-900 hover:bg-rose-500/10'
          }`}
        >
          <Bell className="w-3 h-3 mr-2" /> Notice Board
        </button>
        <button 
          onClick={() => setActiveTab('syllabus')} 
          className={`flex-1 md:flex-none flex items-center justify-center px-6 py-3 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all ${
            activeTab === 'syllabus' 
              ? 'bg-rose-500/20 text-rose-950 border border-rose-400/40 shadow-inner' 
              : 'text-rose-900/60 hover:text-rose-900 hover:bg-rose-500/10'
          }`}
        >
          <FileText className="w-3 h-3 mr-2" /> Academic Vault
        </button>
      </div>

      <div className="min-h-[50vh]">
        <AnimatePresence mode="wait">
          
          {/*notice tab*/}
          {activeTab === 'notices' && (
            <motion.div 
              key="notices"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {announcements.length === 0 ? (
                <div className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-10 text-center shadow-inner">
                  <p className="text-rose-800/60 text-sm font-light">No announcements have been posted yet.</p>
                </div>
              ) : (
                announcements.map((notice, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    key={notice.id} 
                    className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-6 md:p-8 hover:bg-rose-500/20 transition-all shadow-[0_4px_20px_rgba(225,29,72,0.08)] group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {notice.urgency === 'high' ? (
                          <div className="flex items-center px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-pulse" /> High Priority
                          </div>
                        ) : (
                          <div className="flex items-center px-3 py-1 rounded-full bg-white/40 border border-rose-200/50 text-rose-800 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                            <Bell className="w-2.5 h-2.5 mr-1.5 opacity-70" /> Standard
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-rose-800/60 font-mono flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5 opacity-70" /> {formatDate(notice.created_at)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-serif text-rose-950 mb-3">{notice.title}</h3>
                    <p className="text-rose-900/80 text-sm md:text-base font-light leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/*syllabus tab*/}
          {activeTab === 'syllabus' && (
            <motion.div 
              key="syllabus"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {syllabusFiles.length === 0 ? (
                <div className="col-span-full bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 border-dashed rounded-[2.5rem] p-10 text-center shadow-inner">
                  <p className="text-rose-800/60 text-sm font-light">No syllabus or files have been uploaded yet.</p>
                </div>
              ) : (
                syllabusFiles.map((file, index) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                    key={file.id} 
                    className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-6 hover:bg-rose-500/20 transition-all shadow-[0_4px_20px_rgba(225,29,72,0.08)] flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white/40 border border-rose-300/50 flex items-center justify-center mb-6 shadow-inner group-hover:bg-white/60 transition-colors">
                        <FileText className="w-6 h-6 text-rose-600" />
                      </div>
                      <h3 className="text-lg font-serif text-rose-950 mb-2 line-clamp-2">{file.title}</h3>
                      <p className="text-[10px] text-rose-800/60 font-mono mb-6">
                        Added: {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-auto pt-4 border-t border-rose-400/20">
                      <button 
                        onClick={() => window.open(file.file_url, '_blank')}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-white/40 border border-rose-300/50 hover:bg-white/70 hover:border-rose-400/50 text-rose-900 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" /> View
                      </button>
                      <a 
                        href={file.file_url} 
                        download
                        className="flex items-center justify-center px-4 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(225,29,72,0.3)]"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}