'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Legacy() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchLegacy = async () => {
      const { data } = await supabase
        .from('site_legacy')
        .select('*')
        .order('created_at', { ascending: true }); 
      
      if (data) setLeaders(data);
      setLoading(false);
    };
    fetchLegacy();
  }, []);

  if (loading || leaders.length === 0) return null; 

  return (
    <section className="relative py-32 border-t border-rose-100/50">
      
      <div className="text-center mb-24 px-6 relative z-10">
        <p className="text-rose-500 font-bold text-sm tracking-[0.3em] mb-4 uppercase">The Visionaries</p>
        <h2 className="font-serif text-5xl md:text-6xl text-rose-950 drop-shadow-sm">Our Legacy</h2>
      </div>

      <div className="flex relative w-full max-w-7xl mx-auto px-6">
                <div className="hidden md:block w-1/2 sticky top-32 h-[75vh] rounded-[2.5rem] overflow-hidden border border-rose-200 bg-white/40 backdrop-blur-xl shadow-[0_10px_40px_rgba(225,29,72,0.1)]">
           <AnimatePresence mode="wait">
             <motion.img 
               key={activeIndex}
               src={leaders[activeIndex]?.image_url}
               alt={leaders[activeIndex]?.name}
               initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
               animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               className="w-full h-full object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-700"
             />
           </AnimatePresence>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/30 to-transparent pointer-events-none" />
           
           <div className="absolute bottom-12 left-12 z-10">
              <p className="text-rose-600 font-bold font-mono tracking-widest text-sm mb-2 uppercase drop-shadow-sm">
                Term: {leaders[activeIndex]?.term}
              </p>
              <h3 className="font-serif text-5xl text-rose-950 drop-shadow-sm">
                {leaders[activeIndex]?.name}
              </h3>
           </div>
        </div>
        <div className="w-full md:w-1/2 md:pl-20 pb-[20vh]">
          {leaders.map((leader, index) => (
            <motion.div 
              key={leader.id}
              viewport={{ margin: "-45% 0px -45% 0px" }} 
              onViewportEnter={() => setActiveIndex(index)}
              className="min-h-[75vh] flex flex-col justify-center py-16"
            >
              {/*mobile only portrait */}
              <div className="md:hidden mb-12">
                <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden mb-8 border border-rose-200 bg-white/40 backdrop-blur-md shadow-[0_8px_32px_rgba(225,29,72,0.1)] relative">
                   <img src={leader.image_url} alt={leader.name} className="w-full h-full object-cover grayscale" />
                   <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent pointer-events-none" />
                </div>
                <p className="text-rose-600 font-bold font-mono tracking-widest text-xs mb-2 uppercase">Term: {leader.term}</p>
                <h3 className="font-serif text-4xl text-rose-950">{leader.name}</h3>
              </div>

              {/*biography box*/}
              <motion.div 
                initial={{ opacity: 0.3, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <p className="text-2xl md:text-3xl italic text-rose-800 mb-8 leading-snug font-serif drop-shadow-sm">
                  "{leader.bio.split('.')[0]}."
                </p>
                
                <div className="w-12 h-1 bg-rose-400/50 mb-8 rounded-full shadow-sm" />
                
                <p className="text-rose-950/70 text-lg leading-relaxed font-light whitespace-pre-wrap">
                  {leader.bio}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}