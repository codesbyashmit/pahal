'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Users, UploadCloud, Trash2, Loader2, Plus, TreePine, GraduationCap, BadgeCheck, FileText, FileUp } from 'lucide-react';

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'legacy' | 'team' | 'syllabus'>('gallery');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string, name: string } | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [legacyItems, setLegacyItems] = useState<any[]>([]);
  const [teamItems, setTeamItems] = useState<any[]>([]);
  const [syllabusItems, setSyllabusItems] = useState<any[]>([]);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'village' | 'college'>('village');
  const [legacyForm, setLegacyForm] = useState({ name: '', term: '', bio: '' });
  const [teamForm, setTeamForm] = useState({ name: '', role: '', category: 'Core Member', quote: '' });
  const [syllabusTitle, setSyllabusTitle] = useState('');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'village' | 'college'>('all');
  const [file, setFile] = useState<File | Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: adminProfile } = await supabase.from('profiles').select('id, name').eq('id', session.user.id).single();
      if (adminProfile) setCurrentAdmin(adminProfile);
    }
    const [galleryRes, legacyRes, teamRes, syllabusRes] = await Promise.all([
      supabase.from('site_gallery').select('*').order('created_at', { ascending: false }),
      supabase.from('site_legacy').select('*').order('created_at', { ascending: false }),
      supabase.from('site_team').select('*').order('created_at', { ascending: false }),
      supabase.from('site_syllabus').select('*').order('created_at', { ascending: false })
    ]);
    if (galleryRes.data) setGalleryItems(galleryRes.data);
    if (legacyRes.data) setLegacyItems(legacyRes.data);
    if (teamRes.data) setTeamItems(teamRes.data);
    if (syllabusRes.data) setSyllabusItems(syllabusRes.data);
    setLoading(false);
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
        setIsCompressing(true);
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true };
        try {
          const compressedFile = await imageCompression(selectedFile, options);
          setFile(compressedFile);
        } catch (error) {
          console.error("Compression error:", error);
          setFile(selectedFile); 
        } finally {
          setIsCompressing(false);
        }
      } else {
        setPreview(null);
        setFile(selectedFile);
      }
    }
  };
  const clearForm = () => {
    setFile(null);
    setPreview(null);
    setGalleryCaption('');
    setGalleryCategory('village');
    setSyllabusTitle('');
    setLegacyForm({ name: '', term: '', bio: '' });
    setTeamForm({ name: '', role: '', category: 'Core Member', quote: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const uploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    if (!file && activeTab !== 'team') return alert('Please select a file first.');
    if (!file && activeTab === 'team' && !window.confirm('Add team member without a photo?')) return;
    setIsSubmitting(true);
    let publicUrl = null;
    if (file) {
      const fileExt = (file as File).name?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('website_assets').upload(fileName, file);

      if (uploadError) {
        alert('Upload failed: ' + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage.from('website_assets').getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    }

    let logDetails = '';

    if (activeTab === 'gallery') {
      const { data } = await supabase.from('site_gallery')
        .insert([{ image_url: publicUrl, caption: galleryCaption, category: galleryCategory }]).select().single();
      if (data) setGalleryItems([data, ...galleryItems]);
      logDetails = `Uploaded new photo to ${galleryCategory} gallery.`;
    } else if (activeTab === 'legacy') {
      const { data } = await supabase.from('site_legacy')
        .insert([{ ...legacyForm, image_url: publicUrl }]).select().single();
      if (data) setLegacyItems([data, ...legacyItems]);
      logDetails = `Added legacy profile for ${legacyForm.name}.`;
    } else if (activeTab === 'team') {
      const { data } = await supabase.from('site_team')
        .insert([{ ...teamForm, image_url: publicUrl }]).select().single();
      if (data) setTeamItems([data, ...teamItems]);
      logDetails = `Added team member: ${teamForm.name} (${teamForm.role}).`;
    } else if (activeTab === 'syllabus') {
      const { data } = await supabase.from('site_syllabus')
        .insert([{ title: syllabusTitle, file_url: publicUrl }]).select().single();
      if (data) setSyllabusItems([data, ...syllabusItems]);
      logDetails = `Uploaded resource: ${syllabusTitle}.`;
    }
    await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: 'PUBLISHED_CONTENT', details: logDetails
    });

    clearForm();
    setIsSubmitting(false);
  };

  const deleteItem = async (id: string, table: string, imageUrl: string | null, nameIdentifier: string) => {
    if (!currentAdmin || !window.confirm('Remove this item and permanently delete its file?')) return;

    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) await supabase.storage.from('website_assets').remove([fileName]);
    }

    await supabase.from(table).delete().eq('id', id);
        await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: 'DELETED_CONTENT', details: `Removed content from ${table.replace('site_', '')}: ${nameIdentifier}`
    });

    if (table === 'site_gallery') setGalleryItems(galleryItems.filter(i => i.id !== id));
    if (table === 'site_legacy') setLegacyItems(legacyItems.filter(i => i.id !== id));
    if (table === 'site_team') setTeamItems(teamItems.filter(i => i.id !== id));
    if (table === 'site_syllabus') setSyllabusItems(syllabusItems.filter(i => i.id !== id));
  };

  const filteredGallery = galleryItems.filter(item => galleryFilter === 'all' || item.category === galleryFilter);

  if (loading) return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="w-10 h-10 border-4 border-rose-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
    </div>
  );

  return (
    <div className="pb-20">
      <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="font-serif text-4xl mb-2 text-white drop-shadow-md">Website Content</h2>
          <p className="text-rose-200/70">Update the live landing page dynamically.</p>
        </div>
        
        <div className="flex bg-black/40 backdrop-blur-md border border-rose-500/20 rounded-xl p-1 shadow-lg w-full xl:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'gallery', icon: ImageIcon, label: 'Gallery' },
            { id: 'legacy', icon: Users, label: 'Legacy' },
            { id: 'team', icon: BadgeCheck, label: 'Our Team' },
            { id: 'syllabus', icon: FileText, label: 'Resources' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); clearForm(); }} className={`flex-1 xl:flex-none flex justify-center items-center px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-rose-500/30 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}>
              <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/*uload form */}
        <div className="lg:col-span-5">
          <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] p-8 sticky top-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
            <h3 className="text-xl font-serif text-white mb-6 flex items-center drop-shadow-md">
              <Plus className="w-5 h-5 mr-2 text-rose-400" /> 
              {activeTab === 'gallery' ? 'Add to Gallery' : activeTab === 'legacy' ? 'Add President/Leader' : activeTab === 'team' ? 'Add Team Member' : 'Add Resource'}
            </h3>
            
            <form onSubmit={uploadAndSave} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all group ${preview || file ? 'border-rose-500/50 bg-black/40' : 'border-rose-500/20 bg-black/20 hover:bg-black/40 hover:border-rose-500/40'}`}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className={`w-full h-full object-cover transition-opacity ${isCompressing ? 'opacity-30' : 'opacity-100'}`} />
                ) : file ? (
                  <div className="text-center p-6 flex flex-col items-center text-rose-200/80">
                    <FileUp className="w-10 h-10 mb-2 opacity-60" />
                    <p className="text-xs font-mono truncate max-w-[220px]">{(file as File).name}</p>
                  </div>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-rose-300/50 group-hover:text-rose-300 transition-colors mb-2" />
                    <p className="text-xs text-rose-200/60 uppercase tracking-widest font-bold">
                      {activeTab === 'team' ? 'Upload Photo (1:1 Square Ideal)' : activeTab === 'syllabus' ? 'Click to Upload PDF / Doc' : 'Click to Upload Image'}
                    </p>
                  </div>
                )}
                {isCompressing && <Loader2 className="absolute w-8 h-8 text-rose-400 animate-spin drop-shadow-md" />}
                <input
                  type="file"
                  accept={activeTab === 'syllabus' ? '.pdf,.doc,.docx' : 'image/*'}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/*gallery area */}
              {activeTab === 'gallery' && (
                <>
                  <div className="flex bg-black/30 p-1 rounded-xl border border-rose-500/10">
                    <button type="button" onClick={() => setGalleryCategory('village')} className={`flex-1 flex justify-center items-center text-[10px] font-bold tracking-widest uppercase py-3 rounded-lg transition-all ${galleryCategory === 'village' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner' : 'text-rose-200/40 hover:text-white'}`}>
                      <TreePine className="w-3 h-3 mr-2" /> Village Visit
                    </button>
                    <button type="button" onClick={() => setGalleryCategory('college')} className={`flex-1 flex justify-center items-center text-[10px] font-bold tracking-widest uppercase py-3 rounded-lg transition-all ${galleryCategory === 'college' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner' : 'text-rose-200/40 hover:text-white'}`}>
                      <GraduationCap className="w-3 h-3 mr-2" /> College Event
                    </button>
                  </div>
                  <input type="text" placeholder="Image Caption " value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30" />
                </>
              )}

              {/*president area*/}
              {activeTab === 'legacy' && (
                <>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Full Name" required value={legacyForm.name} onChange={(e) => setLegacyForm({...legacyForm, name: e.target.value})} className="w-2/3 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30" />
                    <input type="text" placeholder="Term (e.g. 23-24)" required value={legacyForm.term} onChange={(e) => setLegacyForm({...legacyForm, term: e.target.value})} className="w-1/3 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30 font-mono text-xs" />
                  </div>
                  <textarea placeholder="Short Biography or Description..." required rows={3} value={legacyForm.bio} onChange={(e) => setLegacyForm({...legacyForm, bio: e.target.value})} className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner resize-none placeholder:text-rose-200/30" />
                </>
              )}

              {/*coreteam area*/}
              {activeTab === 'team' && (
                <>
                  <input type="text" placeholder="Full Name" required value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30" />
                  <div className="flex gap-4">
                    <input type="text" placeholder="Specific Role (e.g., Web Dev)" required value={teamForm.role} onChange={(e) => setTeamForm({...teamForm, role: e.target.value})} className="w-1/2 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30 text-sm" />
                    <select required value={teamForm.category} onChange={(e) => setTeamForm({...teamForm, category: e.target.value})} className="w-1/2 bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer">
                      <option value="Faculty Coordinator" className="bg-neutral-900 text-white">Faculty Coordinator</option>
                      <option value="President" className="bg-neutral-900 text-white">President</option>
                      <option value="Vice President" className="bg-neutral-900 text-white">Vice President</option>
                      <option value="Student Coordinator" className="bg-neutral-900 text-white">Student Coordinator</option>
                      <option value="Technical Lead" className="bg-neutral-900 text-white">Technical Lead</option>
                      <option value="Core Member" className="bg-neutral-900 text-white">Core Member</option>
                    </select>
                  </div>
                  <textarea placeholder="A 2-line quote or short bio..." rows={2} value={teamForm.quote} onChange={(e) => setTeamForm({...teamForm, quote: e.target.value})} className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner resize-none placeholder:text-rose-200/30" />
                </>
              )}

              {/*resources and announcement area*/}
              {activeTab === 'syllabus' && (
                <input type="text" placeholder="Resource Title (e.g. Mid-Sem Syllabus)" required value={syllabusTitle} onChange={(e) => setSyllabusTitle(e.target.value)} className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-400 outline-none transition-all shadow-inner placeholder:text-rose-200/30" />
              )}

              <button disabled={isSubmitting || isCompressing} className="w-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold tracking-widest text-xs uppercase py-4 rounded-xl hover:bg-rose-500/30 transition-all flex justify-center items-center shadow-[0_0_15px_rgba(225,29,72,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" /> : 'Publish to Live Site'}
              </button>
            </form>
          </div>
        </div>

        {/*preview grid*/}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            
            {activeTab === 'gallery' && (
              <motion.div key="g-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 p-2 rounded-2xl">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-rose-200/50 ml-4 hidden sm:block">Live Preview Grid</span>
                  <div className="flex gap-1 w-full sm:w-auto">
                    {['all', 'village', 'college'].map(f => (
                      <button key={f} onClick={() => setGalleryFilter(f as any)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${galleryFilter === f ? 'bg-rose-500/20 text-white shadow-inner border border-rose-500/20' : 'text-rose-200/40 hover:text-white'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredGallery.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group bg-black/40 border border-rose-500/10 shadow-lg">
                      <img src={item.image_url} alt={item.caption || 'Gallery Image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 shadow-lg">
                         <span className={`text-[8px] font-bold uppercase tracking-widest ${item.category === 'village' ? 'text-blue-300' : 'text-amber-300'}`}>{item.category}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        {item.caption && <p className="text-rose-50 text-xs mb-3 drop-shadow-md truncate">{item.caption}</p>}
                        <button onClick={() => deleteItem(item.id, 'site_gallery', item.image_url, item.caption || 'Gallery Image')} className="flex items-center text-[10px] text-rose-400 font-bold tracking-widest uppercase hover:text-rose-300 bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredGallery.length === 0 && <p className="text-center text-rose-200/40 py-10">No images found in this category.</p>}
              </motion.div>
            )}

            {activeTab === 'legacy' && (
              <motion.div key="l-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {legacyItems.map(item => (
                  <div key={item.id} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-4 flex gap-4 group hover:bg-black/20 hover:border-rose-500/20 transition-all shadow-lg">
                    <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-rose-500/20 shadow-inner">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-serif text-white">{item.name}</h4>
                          <span className="text-[10px] font-mono text-rose-300/70 border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 rounded uppercase">{item.term}</span>
                        </div>
                        <button onClick={() => deleteItem(item.id, 'site_legacy', item.image_url, item.name)} className="p-2 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-rose-100/60 mt-2 line-clamp-2">{item.bio}</p>
                    </div>
                  </div>
                ))}
                {legacyItems.length === 0 && <p className="text-center text-rose-200/40 py-10">No legacy profiles active.</p>}
              </motion.div>
            )}
            {activeTab === 'team' && (
              <motion.div key="t-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {teamItems.map(item => (
                  <div key={item.id} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-4 flex gap-5 group hover:bg-black/20 hover:border-rose-500/20 transition-all shadow-lg items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-rose-500/20 shadow-inner bg-black/50">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <Users className="w-full h-full p-4 text-rose-300/50" />
                      )}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-serif text-white mb-1">{item.name}</h4>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded shadow-sm">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono text-rose-200/60">{item.role}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteItem(item.id, 'site_team', item.image_url, item.name)} className="p-3 bg-black/30 border border-rose-500/10 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {teamItems.length === 0 && <p className="text-center text-rose-200/40 py-10">No team members added yet.</p>}
              </motion.div>
            )}
            {activeTab === 'syllabus' && (
              <motion.div key="s-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {syllabusItems.map(item => (
                  <div key={item.id} className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-4 flex justify-between items-center group hover:bg-black/20 hover:border-rose-500/20 transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-serif text-base">{item.title}</h4>
                        <p className="text-[10px] font-mono text-rose-200/40 uppercase tracking-widest mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteItem(item.id, 'site_syllabus', item.file_url, item.title)} className="p-3 bg-black/30 border border-rose-500/10 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {syllabusItems.length === 0 && <p className="text-center text-rose-200/40 py-10">No resources uploaded yet.</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}