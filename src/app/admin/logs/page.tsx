'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { History, ShieldAlert, CheckCircle2, Ban, PlusCircle, PenTool, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Only fetch the last 100 to keep it fast

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('APPROVED') || action.includes('ATTENDANCE')) return <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />;
    
    // Custom Icon for CMS Uploads
    if (action === 'PUBLISHED_CONTENT') return <ImageIcon className="w-5 h-5 text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.5)]" />;
    
    // Custom Icon for CMS Deletions
    if (action === 'DELETED_CONTENT') return <Trash2 className="w-5 h-5 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />;
    
    if (action.includes('BANNED') || action.includes('REJECTED') || action.includes('DELETED')) return <Ban className="w-5 h-5 text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />;
    if (action.includes('CREATED')) return <PlusCircle className="w-5 h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />;
    
    return <PenTool className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />;
  };

  return (
    <div className="pb-20">
      <header className="mb-10">
        <h2 className="font-serif text-4xl mb-2 text-white drop-shadow-md">System Logs</h2>
        <p className="text-rose-200/70">Chronological audit trail of all core team actions.</p>
      </header>

      <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-6 min-h-[600px] shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-rose-200/40">
            <History className="w-12 h-12 mb-4 opacity-50" />
            <p>No system activity recorded yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="flex flex-col gap-4">
              {logs.map((log, index) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-rose-500/10 hover:bg-black/40 hover:border-rose-500/30 transition-all shadow-inner group"
                >
                  <div className="p-2 bg-black/40 rounded-lg border border-rose-500/20 shrink-0 mt-1 shadow-sm group-hover:bg-rose-950/30 transition-colors">
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-rose-50">{log.details}</p>
                      <span className="text-[10px] uppercase tracking-widest font-mono text-rose-300/50 whitespace-nowrap ml-4">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded shadow-sm">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-rose-200/40 font-mono">
                        Admin: {log.admin_name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}