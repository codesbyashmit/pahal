'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORY_ORDER = [
  'Faculty Coordinator',
  'President',
  'Vice President',
  'Student Coordinator',
  'Technical Lead',
  'Core Member'
];

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from('site_team')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setMembers(data);
      setLoading(false);
    };
    fetchTeam();
  }, []);

  const groupedMembers = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = members.filter(m => m.category === category);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen relative z-10 font-sans text-rose-950 pb-24">
      
      {/*background*/}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-rose-50">
        <img 
          src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2564&auto=format&fit=crop" 
          alt="Background Texture" 
          className="w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-white/60 to-rose-50/80" />
      </div>

      {/*navbar*/}
      <nav className="w-full p-6 md:p-8 flex justify-between items-center">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center text-xs font-bold tracking-widest text-rose-600 hover:text-rose-800 transition-colors uppercase bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </button>
      </nav>

      <div className="text-center pt-10 pb-16 px-6 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center p-3 bg-white/50 backdrop-blur-xl border border-white/60 rounded-full mb-6 shadow-sm"
        >
          <Users className="w-6 h-6 text-rose-500" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl text-rose-950 mb-6 drop-shadow-sm"
        >
          The Core Team
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-rose-900/60 text-lg font-light leading-relaxed"
        >
          Meet the dedicated minds and passionate hearts driving Pahal's mission forward, day in and day out.
        </motion.p>
      </div>

      {/*content*/}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-white border-t-rose-400 rounded-full animate-spin shadow-sm" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 bg-white/30 backdrop-blur-xl border border-dashed border-rose-300 rounded-[3rem]">
            <p className="font-serif text-2xl text-rose-800/50 italic">Team members will appear here soon.</p>
          </div>
        ) : (
          <div className="space-y-24">
            
            {/*render in hiarchy order*/}
            {CATEGORY_ORDER.map((category) => {
              const sectionMembers = groupedMembers[category];
              if (!sectionMembers || sectionMembers.length === 0) return null;
              const isMasonry = category === 'Core Member';

              return (
                <section key={category} className="relative">
                  <div className="flex items-center justify-center mb-12">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-rose-200/50" />
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-rose-500 px-6">
                      {category}s
                    </h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-rose-200/50" />
                  </div>

                  {isMasonry ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                      {sectionMembers.map((member, idx) => (
                        <div key={member.id} className="break-inside-avoid">
                          <TeamCard member={member} index={idx} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                      {sectionMembers.map((member, idx) => (
                        <div key={member.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                          <TeamCard member={member} index={idx} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

          </div>
        )}
      </div>

    </div>
  );
}

function TeamCard({ member, index }: { member: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-white/30 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(225,29,72,0.05)] rounded-[2.5rem] p-8 flex flex-col items-center text-center hover:bg-white/50 hover:-translate-y-2 transition-all duration-500"
    >
            <div className="w-32 h-32 rounded-full mb-6 p-1 bg-gradient-to-br from-rose-200 to-white shadow-lg">
        <div className="w-full h-full rounded-full overflow-hidden border border-white bg-rose-50">
          {member.image_url ? (
            <img 
              src={member.image_url} 
              alt={member.name} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <Users className="w-12 h-12 m-auto mt-9 text-rose-200" />
          )}
        </div>
      </div>

      <h3 className="font-serif text-2xl text-rose-950 mb-1">{member.name}</h3>
      
      <span className="text-[9px] font-bold tracking-widest uppercase text-rose-600 bg-white/60 border border-rose-100 px-4 py-1.5 rounded-full mb-5 shadow-sm">
        {member.role}
      </span>
      {member.quote && (
        <p className="text-sm text-rose-900/70 font-light leading-relaxed line-clamp-3 italic">
          "{member.quote}"
        </p>
      )}
    </motion.div>
  );
}