'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Mission from '@/components/Mission';
import Gallery from '@/components/Gallery';
import Legacy from '@/components/Legacy';

export default function Home() {
  const [isEventMode, setIsEventMode] = useState(false);
  const [clickOrigin, setClickOrigin] = useState({ x: 0, y: 0 });
  const router = useRouter();

  const handleToggle = (e: React.MouseEvent) => {
    setClickOrigin({ x: e.clientX, y: e.clientY });
    setIsEventMode(!isEventMode);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden font-sans text-neutral-900">
            <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
        <img 
          src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2564&auto=format&fit=crop" 
          alt="Background Texture" 
          className="w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[80px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-white/60 to-rose-50/80" />
      </div>

      <nav className="fixed top-0 w-full p-6 md:p-8 z-[100] flex flex-col md:flex-row justify-between items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-bold tracking-widest text-rose-950 drop-shadow-sm">Pahal</div>
          
          <button 
            onClick={() => router.push('/team')}
            className="flex items-center text-xs font-bold tracking-widest text-rose-600 hover:text-rose-800 hover:bg-rose-500/10 px-4 py-2 rounded-full transition-all uppercase"
          >
            <Users className="w-4 h-4 mr-2" /> Our Team
          </button>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/auth')}
            className="rounded-full bg-white/60 backdrop-blur-xl border border-rose-200 text-rose-900 px-6 py-2.5 text-xs font-bold tracking-widest hover:bg-white/80 transition-all uppercase shadow-[0_4px_15px_rgba(225,29,72,0.05)]"
          >
            Member Login
          </button>

          <button 
            onClick={handleToggle}
            className="rounded-full bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 text-rose-700 px-6 py-2.5 text-xs font-bold tracking-widest hover:bg-rose-500/25 transition-all uppercase shadow-[0_4px_15px_rgba(225,29,72,0.1)]"
          >
            {isEventMode ? 'RETURN TO PAHAL' : 'ENTER ANKURAN'}
          </button>
        </div>
      </nav>
      <div className="absolute inset-0 z-10 overflow-y-auto h-full scroll-smooth">
                <div className="relative flex min-h-screen flex-col items-center justify-center p-8 text-center pt-20">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif text-6xl md:text-8xl tracking-tight mb-8 leading-tight text-rose-950 drop-shadow-sm"
          >
            Pahal <br/> 
            <span className="italic text-rose-500">Ek Nanha Kadam</span>
          </motion.h1>
                    <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-white/50 backdrop-blur-2xl border border-rose-200 shadow-[0_10px_40px_rgba(225,29,72,0.08)] rounded-full px-8 py-4 mb-16"
          >
            <p className="text-rose-800 text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
              Every journey begins with a small step
            </p>
          </motion.div>

          <div className="absolute bottom-10 flex flex-col items-center opacity-60 text-rose-800">
            <ChevronDown className="h-6 w-6 mb-2 animate-bounce" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Scroll to explore</span>
          </div>
        </div>

        <Mission />
        <Gallery />
        <Legacy />
        
        <div className="h-24"></div> 
      </div>

      {/*ankuaran ripple*/}
      <motion.div
        initial={false}
        animate={{ 
          clipPath: isEventMode 
            ? `circle(150vmax at ${clickOrigin.x}px ${clickOrigin.y}px)` 
            : `circle(0px at ${clickOrigin.x}px ${clickOrigin.y}px)` 
        }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        className={`absolute inset-0 z-50 bg-amber-950 text-amber-50 overflow-y-auto ${isEventMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center pt-20">
          <h1 className="font-serif text-7xl md:text-9xl mb-4 italic text-amber-500">Ankuran</h1>
          <p className="text-xl mb-12 tracking-widest uppercase text-amber-200/60">Dharohar 2026</p>
          
          <div className="max-w-2xl text-center">
            <p className="text-amber-100/80 mb-8 leading-relaxed">
              Welcome to the biggest cultural event of the year. Register your team, view the timeline, and be part of the legacy.
            </p>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 border border-amber-500/30 rounded-2xl bg-amber-900/50 backdrop-blur-md">Events Timeline</div>
               <div className="p-6 border border-amber-500/30 rounded-2xl bg-amber-900/50 backdrop-blur-md">Register Team</div>
            </div>
          </div>
        </div>
      </motion.div>

    </main>
  );
}