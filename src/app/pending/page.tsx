'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-6 text-white">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-md p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin mb-6" />
        <h2 className="font-serif text-4xl mb-2">Verification Pending.</h2>
        <p className="text-neutral-400 mb-8 max-w-sm leading-relaxed">
          Your Pahal UID is being generated. The core team is currently reviewing your college details. Check back later or watch your email for approval.
        </p>
        <button 
          onClick={() => router.push('/')} 
          className="text-sm tracking-widest text-rose-400 uppercase hover:text-rose-300 transition-colors border-b border-rose-400/50 hover:border-rose-300 pb-1"
        >
          Return to Home
        </button>
      </motion.div>
    </div>
  );
}