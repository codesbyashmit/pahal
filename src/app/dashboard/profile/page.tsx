'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, BookOpen, GraduationCap, 
  MapPin, Settings, ShieldCheck, Download, Edit3, X, CheckCircle2 
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ attended: 0, total: 0, percentage: 0 });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [formData, setFormData] = useState({ phone: '', course: '', branch: '', section: '', gender: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

    const { data: allEvents } = await supabase.from('events').select('*, attendance_records(id)').order('date', { ascending: false });

    const { data: userAttendance } = await supabase.from('attendance_records').select('event_id').eq('user_id', session.user.id).eq('status', 'Present');

    if (profileData && allEvents) {
      setProfile(profileData);
      setFormData({ 
        phone: profileData.phone || '', 
        course: profileData.course || '', 
        branch: profileData.branch || '', 
        section: profileData.section || '',
        gender: profileData.gender || ''
      });
      
      const now = new Date();
      const validEvents = allEvents.filter(event => new Date(event.date) < now || (event.attendance_records && event.attendance_records.length > 0));

      const totalCount = validEvents.length;
      const attendedCount = userAttendance?.length || 0;
      const perc = totalCount ? Math.round((attendedCount / totalCount) * 100) : 0;
      
      setStats({ attended: attendedCount, total: totalCount, percentage: perc });
    }
    setLoading(false);
  };

  const handleRequestUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('profile_update_requests').insert({
      user_id: session.user.id,
      ...formData,
      status: 'pending'
    });

    if (!error) {
      setRequestSent(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setRequestSent(false);
      }, 2000);
    }
  };

  const handleDownloadID = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0 font-sans text-rose-950">
      
      {/*id card*/}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 md:p-8 mb-8 overflow-hidden shadow-[0_8px_32px_rgba(225,29,72,0.15)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 rounded-3xl bg-white/40 border-2 border-rose-200/50 overflow-hidden shrink-0 shadow-lg">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-6 text-rose-300" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left w-full md:w-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h2 className="text-3xl font-serif text-rose-950">{profile.name}</h2>
              <span className="bg-rose-500/20 text-rose-700 border border-rose-400/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase h-fit mx-auto md:mx-0 shadow-sm">
                {profile.role === 'member' ? 'Official Member' : 'Core Team'}
              </span>
            </div>
            <p className="text-rose-800/60 font-mono text-sm tracking-widest mb-6 uppercase font-bold">UID: {profile.uid}</p>
            <div className="w-full">
              <div className="bg-white/40 p-4 rounded-2xl border border-rose-200/50 shadow-inner">
                <p className="text-[10px] uppercase text-rose-800/50 font-bold tracking-wider mb-1">Overall Attendance</p>
                <p className={`text-3xl font-serif ${stats.percentage >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>{stats.percentage}%</p>
              </div>
            </div>
          </div>
          <button onClick={handleDownloadID} title="Download ID Card" className="p-3 bg-white/40 hover:bg-white/60 border border-rose-200/50 rounded-2xl transition-all shrink-0 hidden md:block shadow-sm">
            <Download className="w-5 h-5 text-rose-600" />
          </button>
        </div>
      </motion.div>

      {/*details grid*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-rose-200/30 pb-4">
            <h3 className="font-serif text-xl text-rose-950">Academic Details</h3>
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-white/40 rounded-lg transition-colors">
              <Edit3 className="w-4 h-4 text-rose-400 hover:text-rose-600" />
            </button>
          </div>
          <div className="space-y-4">
            <DetailItem icon={GraduationCap} label="Course" value={profile.course} />
            <DetailItem icon={BookOpen} label="Branch" value={profile.branch} />
            <DetailItem icon={ShieldCheck} label="College QID" value={profile.qid} />
            <DetailItem icon={MapPin} label="Logistics" value={profile.hosteler_status} />
          </div>
        </section>
        <section className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-rose-200/30 pb-4">
            <h3 className="font-serif text-xl text-rose-950">Personal Info</h3>
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-white/40 rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-rose-400 hover:text-rose-600" />
            </button>
          </div>
          <div className="space-y-4">
            <DetailItem icon={Mail} label="Email Address" value={profile.email} />
            <DetailItem icon={Phone} label="WhatsApp Number" value={profile.phone || 'Not provided'} />
            <DetailItem icon={User} label="Gender" value={profile.gender || 'Not specified'} />
          </div>
        </section>
      </div>

      {/*update request modal*/}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/20 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/90 border border-rose-200 w-full max-w-lg rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 transition-colors">
                <X className="w-6 h-6" />
              </button>

              {requestSent ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif text-rose-950 mb-2">Request Sent!</h3>
                  <p className="text-rose-800/60 font-light">The Core Team will review your changes shortly.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-serif text-rose-950 mb-2">Request Profile Update</h3>
                  <p className="text-rose-800/60 text-sm mb-8 font-light">Official changes require admin verification.</p>
                  
                  <form onSubmit={handleRequestUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-rose-400 font-bold ml-2">Phone</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-950 outline-none focus:border-rose-500/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-rose-400 font-bold ml-2">Gender</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-950 outline-none focus:border-rose-500/50 appearance-none">
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-rose-400 font-bold ml-2">Course</label>
                        <input type="text" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-950 outline-none focus:border-rose-500/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-rose-400 font-bold ml-2">Section</label>
                        <input type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-950 outline-none focus:border-rose-500/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-rose-400 font-bold ml-2">Branch</label>
                      <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-950 outline-none focus:border-rose-500/50" />
                    </div>
                    <button type="submit" className="w-full bg-rose-600 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-rose-700 transition-all shadow-lg mt-4">
                      Submit Request
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="p-2 bg-white/40 rounded-xl border border-rose-200/50 group-hover:border-rose-400 transition-all shadow-sm">
      <Icon className="w-4 h-4 text-rose-600" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-widest text-rose-800/50 font-bold">{label}</p>
      <p className="text-sm text-rose-950 font-medium">{value}</p>
    </div>
  </div>
);