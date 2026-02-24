'use client';

import { motion } from 'framer-motion';

export default function Mission() {
  return (
    <section className="relative flex flex-col items-center justify-center py-32 px-6 overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-rose-300/30 blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-rose-500 font-bold text-sm tracking-[0.3em] mb-8 uppercase"
        >
          Our Philosophy
        </motion.p>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-4xl md:text-6xl leading-tight mb-10 text-rose-950 drop-shadow-sm"
        >
          Ek Nanha Kadam. <br />
          <span className="italic text-rose-700/80">One small step towards a brighter tomorrow.</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto font-light"
        >
          Every Sunday, our dedicated volunteers travel to local villages to teach, mentor, and spend time with underprivileged children. On campus, we drive social initiatives that build community and awareness. We believe that real change doesn't require massive leaps—just consistent, compassionate steps.
        </motion.p>
      </div>
    </section>
  );
}