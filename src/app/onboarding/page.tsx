'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2, Upload, UserRound } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  const [photoFile, setPhotoFile] = useState<File | Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', gender: '', course: '', branch: '', section: '', qid: '', hosteler_status: 'Day Scholar',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/auth');
      } else {
         setUserEmail(user.email || '');
         setUserId(user.id);
      }
    };
    getUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      setPhotoPreview(URL.createObjectURL(file));
      setIsCompressing(true);

      const options = {
        maxSizeMB: 0.5, 
        maxWidthOrHeight: 800, 
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(file, options);
        setPhotoFile(compressedFile);
      } catch (error) {
        console.error("Compression error:", error);
        setPhotoFile(file); 
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const submitOnboarding = async () => {
    setLoading(true);
    const generatedUID = `P${formData.qid}`;
    let uploadedPhotoUrl = null;

    if (photoFile) {
      const fileName = `${userId}-${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, photoFile);

      if (uploadError) {
        alert('Error uploading photo: ' + uploadError.message);
        setLoading(false);
        return; 
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      uploadedPhotoUrl = publicUrl;
    }

    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email: userEmail,
      name: formData.name,
      phone: formData.phone,
      gender: formData.gender, 
      course: formData.course,
      branch: formData.branch || 'NA',
      section: formData.section,
      qid: formData.qid,
      hosteler_status: formData.hosteler_status,
      uid: generatedUID,
      profile_photo: uploadedPhotoUrl, 
      status: 'pending' 
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/pending');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-rose-950 font-sans relative z-10">
      
      {/*background image*/}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-rose-50">
        <img 
          src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2564&auto=format&fit=crop" 
          alt="Background Texture" 
          className="w-full h-full object-cover opacity-70 scale-105"
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[60px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 via-transparent to-rose-200/20" />
      </div>

      <div className="w-full max-w-lg flex gap-2 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 shadow-inner border ${step >= i ? 'bg-rose-400 border-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'bg-white/30 border-white/50'}`} />
        ))}
      </div>

      <div className="w-full max-w-lg relative overflow-hidden h-[450px]">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="absolute inset-0">
              <h2 className="font-serif text-4xl mb-2 drop-shadow-sm">Let's get to know you.</h2>
              <p className="text-rose-900/60 mb-8 font-light">What should we call you?</p>
              <div className="space-y-4">
                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition-all" />
                
                <div className="flex gap-4">
                  <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-1/2 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition-all" />
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange} 
                    className="w-1/2 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled hidden className="text-rose-950/40">Select Gender</option>
                    <option value="Male" className="bg-white text-rose-950">Male</option>
                    <option value="Female" className="bg-white text-rose-950">Female</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="absolute inset-0">
              <h2 className="font-serif text-4xl mb-2 drop-shadow-sm">College Details.</h2>
              <p className="text-rose-900/60 mb-8 font-light">This helps us generate your Pahal UID.</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input name="course" placeholder="Course (e.g., B.Tech)" value={formData.course} onChange={handleChange} className="w-1/2 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition-all" />
                  <input name="branch" placeholder="Branch (ECE, CSE, or NA)" value={formData.branch} onChange={handleChange} className="w-1/2 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition-all" />
                </div>
                <div className="flex gap-4">
                  <input name="section" placeholder="Section (or NA)" value={formData.section} onChange={handleChange} className="w-1/3 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition-all" />
                  <input name="qid" placeholder="QID (e.g., 25030128)" value={formData.qid} onChange={handleChange} className="w-2/3 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none font-mono transition-all" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="absolute inset-0">
              <h2 className="font-serif text-4xl mb-2 drop-shadow-sm">Final Step.</h2>
              <p className="text-rose-900/60 mb-8 font-light">Set your profile and accommodation.</p>
              
              <div className="space-y-8 bg-white/20 backdrop-blur-2xl border border-white/40 p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(225,29,72,0.05)]">
                <div className="flex items-center gap-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-rose-300 bg-white/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-rose-400 hover:bg-white/60 transition-all group relative shrink-0 shadow-sm"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className={`w-full h-full object-cover transition-opacity ${isCompressing ? 'opacity-50' : 'opacity-100'}`} />
                    ) : (
                      <UserRound className="w-8 h-8 text-rose-300 group-hover:text-rose-500 transition-colors" />
                    )}
                    
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCompressing ? 'bg-white/80 opacity-100' : 'bg-white/60 opacity-0 group-hover:opacity-100'}`}>
                       {isCompressing ? <Loader2 className="w-6 h-6 text-rose-500 animate-spin" /> : <Upload className="w-6 h-6 text-rose-600" />}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-950 mb-1">Profile Photo (Optional)</p>
                    <p className="text-xs text-rose-900/60 mb-3">Image will be automatically compressed.</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handlePhotoSelect} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="text-[10px] font-bold tracking-widest uppercase border border-white/50 bg-white/30 px-4 py-2 rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50 shadow-sm text-rose-800"
                    >
                      {isCompressing ? 'Optimizing...' : (photoPreview ? 'Change Photo' : 'Upload Photo')}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/30">
                  <p className="text-sm font-bold text-rose-950 mb-3 mt-2">Accommodation Status</p>
                  <select name="hosteler_status" value={formData.hosteler_status} onChange={handleChange} className="w-full bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-xl px-4 py-4 text-rose-950 focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none appearance-none transition-all cursor-pointer">
                    <option value="Day Scholar" className="bg-white text-rose-950">Day Scholar</option>
                    <option value="Hosteler" className="bg-white text-rose-950">Hosteler</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="w-full max-w-lg flex justify-between mt-8">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center text-xs font-bold tracking-widest text-rose-900/50 hover:text-rose-900 transition-colors uppercase">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
        ) : <div />}

        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)} 
            disabled={step === 1 && (!formData.name || !formData.gender)}
            className="flex items-center text-xs tracking-widest text-rose-600 hover:text-rose-800 transition-colors uppercase font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button 
            onClick={submitOnboarding} 
            disabled={loading || isCompressing} 
            className="flex items-center text-xs tracking-widest text-emerald-700 hover:text-emerald-800 transition-colors uppercase font-bold bg-emerald-100/50 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-300/50 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : ''}
            {loading ? 'Processing...' : 'Complete Profile'} 
            {!loading && <Check className="w-4 h-4 ml-2" />}
          </button>
        )}
      </div>

    </div>
  );
}