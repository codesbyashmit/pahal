'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, TreePine, GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'village' | 'college'>('village');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('site_gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setImages(data);
      setLoading(false);
    };
    fetchGallery();
  }, []);

  const filteredImages = images
    .filter(img => img.category === filter)
    .slice(0, 7);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, filteredImages.length - 1) : null);
    if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
    if (e.key === 'Escape') setLightboxIndex(null);
  }, [lightboxIndex, filteredImages.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
  const nextImage = () => setLightboxIndex(i => i !== null ? Math.min(i + 1, filteredImages.length - 1) : null);
  const topImages = filteredImages.slice(0, 3);   // hero + 2 side
  const bottomImages = filteredImages.slice(3, 7); // 4 squares

  return (
    <section className="py-24 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="font-serif text-4xl md:text-6xl mb-4 text-rose-950 drop-shadow-sm"
        >
          Moments of Impact
        </motion.h2>
        <p className="text-rose-800/60 max-w-2xl mx-auto text-sm md:text-base font-light">
          A visual narrative of our grassroots initiatives and vibrant campus culture.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="flex bg-white/50 backdrop-blur-2xl border border-rose-200 shadow-[0_8px_32px_rgba(225,29,72,0.05)] rounded-2xl p-1.5 overflow-x-auto no-scrollbar">
          <FilterButton
            active={filter === 'village'}
            onClick={() => setFilter('village')}            
            label="Village"
            icon={<TreePine className="w-3.5 h-3.5 mr-2" />}
          />
          <FilterButton
            active={filter === 'college'}
            onClick={() => setFilter('college')}
            label="College"
            icon={<GraduationCap className="w-3.5 h-3.5 mr-2" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin shadow-sm" />
        </div>
      ) : filteredImages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 flex flex-col items-center border border-dashed border-rose-200 bg-white/30 backdrop-blur-xl rounded-[3rem] shadow-sm"
        >
          <ImageIcon className="w-16 h-16 mb-6 opacity-20 text-rose-800" />
          <p className="font-serif text-xl italic text-rose-800/50">No moments captured here yet.</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex flex-col gap-3"
          >
            {topImages.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">

                {topImages[0] && (
                  <GalleryCard
                    item={topImages[0]}
                    index={0}
                    onClick={() => setLightboxIndex(0)}
                    className="w-full sm:w-[58%] aspect-[4/3] sm:h-[480px] sm:aspect-auto"
                  />
                )}
                {topImages.length > 1 && (
                  <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-[42%]">
                    {topImages[1] && (
                      <GalleryCard
                        item={topImages[1]}
                        index={1}
                        onClick={() => setLightboxIndex(1)}
                        className="w-1/2 sm:w-full aspect-video"
                      />
                    )}
                    {topImages[2] && (
                      <GalleryCard
                        item={topImages[2]}
                        index={2}
                        onClick={() => setLightboxIndex(2)}
                        className="w-1/2 sm:w-full aspect-video"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/*bottom row*/}
            {bottomImages.length > 0 && (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.min(bottomImages.length, 4)}, minmax(0, 1fr))` }}
              >
                {bottomImages.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={i + 3}
                    onClick={() => setLightboxIndex(i + 3)}
                    className={`aspect-square ${bottomImages.length === 4 ? 'min-w-0' : ''}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 sm:left-6 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center w-full max-w-5xl"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={filteredImages[lightboxIndex].image_url}
                alt={filteredImages[lightboxIndex].caption || 'Pahal Moment'}
                className="max-h-[75vh] max-w-full w-auto rounded-2xl object-contain shadow-2xl"
              />
              <div className="mt-4 text-center px-4">
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-2 inline-block px-3 py-1 rounded-full border ${
                  filteredImages[lightboxIndex].category === 'village'
                    ? 'text-blue-300 border-blue-500/30 bg-blue-500/20'
                    : 'text-amber-300 border-amber-500/30 bg-amber-500/20'
                }`}>
                  {filteredImages[lightboxIndex].category}
                </span>
                {filteredImages[lightboxIndex].caption && (
                  <p className="text-white text-sm font-serif mt-2">
                    {filteredImages[lightboxIndex].caption}
                  </p>
                )}
                <p className="text-neutral-500 text-xs mt-2">
                  {lightboxIndex + 1} / {filteredImages.length}
                </p>
              </div>
            </motion.div>
            {lightboxIndex < filteredImages.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 sm:right-6 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
function GalleryCard({
  item,
  index,
  onClick,
  className = '',
}: {
  item: any;
  index: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'circOut', delay: index * 0.06 }}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden bg-white/20 border border-white/40 shadow-xl cursor-pointer flex-shrink-0 ${className}`}
    >
      <img
        src={item.image_url}
        alt={item.caption || 'Pahal Moment'}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4 md:p-5">
        <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-400">
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5 inline-block px-2.5 py-1 rounded-full border backdrop-blur-md ${
            item.category === 'village'
              ? 'text-blue-300 border-blue-500/30 bg-blue-500/20'
              : 'text-amber-300 border-amber-500/30 bg-amber-500/20'
          }`}>
            {item.category}
          </span>
          {item.caption && (
            <p className="text-white text-sm font-serif leading-tight drop-shadow-lg line-clamp-2">
              {item.caption}
            </p>
          )}
        </div>
      </div>
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
function FilterButton({ active, onClick, label, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-5 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-400 whitespace-nowrap ${
        active
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-400'
          : 'text-rose-800/50 hover:text-rose-900 hover:bg-white/40 border border-transparent'
      }`}
    >
      {icon && icon}
      {label}
    </button>
  );
}