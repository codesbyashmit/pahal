'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Search, UserRound, ShieldAlert, Ban, RotateCcw, PenTool, MoveRight, LayoutTemplate } from 'lucide-react';

export default function AdminMemberships() {
  const [users, setUsers] = useState<any[]>([]);
  const [updateRequests, setUpdateRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'banned' | 'updates'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string, name: string, role: string } | null>(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: adminProfile } = await supabase.from('profiles').select('id, name, role').eq('id', session.user.id).single();
      if (adminProfile) setCurrentAdmin(adminProfile);
    }

    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);

    const { data: requestsData } = await supabase
      .from('profile_update_requests')
      .select('*, profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (requestsData) setUpdateRequests(requestsData);

    setLoading(false);
  };

  const handleStatusChange = async (targetUser: any, newStatus: string) => {
    if (!currentAdmin) return;
    if (newStatus === 'banned' && !window.confirm(`Ban ${targetUser.name}?`)) return;

    setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', targetUser.id);

    if (error) {
      alert('Error updating status. Make sure you have permission.');
      fetchInitialData(); 
      return;
    }

    let actionType = 'UPDATED_USER';
    if (newStatus === 'approved') actionType = 'APPROVED_USER';
    if (newStatus === 'rejected') actionType = 'REJECTED_USER';
    if (newStatus === 'banned') actionType = 'BANNED_USER';
    if (newStatus === 'pending') actionType = 'UNBANNED_USER';

    await supabase.from('audit_logs').insert({
      admin_id: currentAdmin.id, admin_name: currentAdmin.name,
      action: actionType, details: `${currentAdmin.name} changed ${targetUser.name}'s status to ${newStatus.toUpperCase()}.`
    });
  };

  const handleUpdateRequest = async (request: any, action: 'approved' | 'rejected') => {
    if (!currentAdmin) return;
    setUpdateRequests(updateRequests.filter(req => req.id !== request.id));

    if (action === 'approved') {
      const updates: any = {};
      if (request.phone && request.phone !== request.profiles.phone) updates.phone = request.phone;
      if (request.course && request.course !== request.profiles.course) updates.course = request.course;
      if (request.branch && request.branch !== request.profiles.branch) updates.branch = request.branch;
      if (request.section && request.section !== request.profiles.section) updates.section = request.section;
      if (request.gender && request.gender !== request.profiles.gender) updates.gender = request.gender;

      const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', request.user_id);
      if (profileError) {
        alert("Failed to update user profile.");
        fetchInitialData();
        return;
      }
    }
    await supabase.from('profile_update_requests').update({ status: action }).eq('id', request.id);
  };

  const filteredUsers = users.filter(user => 
    user.status === activeTab &&
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.qid?.includes(searchQuery))
  );

  return (
    <div>
      <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl mb-2 text-white drop-shadow-md">Member Approvals</h2>
          <p className="text-rose-200/70 text-sm md:text-base">Verify, approve, or revoke member access.</p>
        </div>
        
        <div className="flex bg-black/40 backdrop-blur-md border border-rose-500/20 rounded-xl p-1 w-full xl:w-auto overflow-x-auto no-scrollbar shadow-xl">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 xl:flex-none px-4 py-3 xl:py-2 rounded-lg text-[10px] xl:text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all ${activeTab === 'pending' ? 'bg-rose-500/30 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}>
            Pending ({users.filter(u => u.status === 'pending').length})
          </button>
          <button onClick={() => setActiveTab('approved')} className={`flex-1 xl:flex-none px-4 py-3 xl:py-2 rounded-lg text-[10px] xl:text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all ${activeTab === 'approved' ? 'bg-rose-500/30 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}>
            Approved ({users.filter(u => u.status === 'approved').length})
          </button>
          <button onClick={() => setActiveTab('updates')} className={`flex-1 xl:flex-none px-4 py-3 xl:py-2 rounded-lg text-[10px] xl:text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all flex items-center justify-center ${activeTab === 'updates' ? 'bg-amber-500/20 text-amber-300 shadow-inner' : 'text-rose-200/50 hover:text-white'}`}>
            Updates ({updateRequests.length})
            {updateRequests.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-2 animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />}
          </button>
          <button onClick={() => setActiveTab('banned')} className={`flex-1 xl:flex-none px-4 py-3 xl:py-2 rounded-lg text-[10px] xl:text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all ${activeTab === 'banned' ? 'bg-rose-500/40 text-white shadow-inner' : 'text-rose-200/50 hover:text-white'}`}>
            Banned ({users.filter(u => u.status === 'banned').length})
          </button>
        </div>
      </header>

      {activeTab !== 'updates' && (
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300/50" />
          <input 
            type="text" placeholder="Search by Name, QID, or Pahal UID..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 backdrop-blur-md border border-rose-500/20 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-rose-400 outline-none transition-all shadow-lg placeholder:text-rose-200/30"
          />
        </div>
      )}

      {/*container*/}
      <div className="bg-rose-950/20 backdrop-blur-xl border border-rose-500/10 rounded-[2rem] overflow-x-auto shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]">
        <div className="min-w-[900px]">
          
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-rose-500/10 text-[10px] font-bold tracking-widest uppercase text-rose-200/50 bg-black/20">
            {activeTab === 'updates' ? (
              <>
                <div className="col-span-3">Student</div>
                <div className="col-span-6">Comparison (Current → Requested)</div>
                <div className="col-span-3 text-right">Actions</div>
              </>
            ) : (
              <>
                <div className="col-span-3">Student</div>
                <div className="col-span-3">Academics</div>
                <div className="col-span-2">Pahal UID</div>
                <div className="col-span-1">Housing</div>
                <div className="col-span-3 text-right">Actions</div>
              </>
            )}
          </div>

          <div className="p-2 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence>
                
                {activeTab === 'updates' && updateRequests.length === 0 && (
                  <div className="flex flex-col justify-center items-center h-64 text-rose-200/40">
                    <PenTool className="w-12 h-12 mb-4 opacity-50" />
                    <p>No profile update requests pending.</p>
                  </div>
                )}
                
                {activeTab === 'updates' && updateRequests.map((req) => (
                  <motion.div key={req.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-12 gap-4 p-4 items-center rounded-xl transition-all border mb-1 bg-black/20 hover:bg-black/40 border-rose-500/5 hover:border-rose-500/20">
                    <div className="col-span-3">
                      <p className="font-medium text-sm text-white">{req.profiles?.name}</p>
                      <p className="text-xs text-rose-300/70 font-mono uppercase">{req.profiles?.uid}</p>
                    </div>
                    
                    <div className="col-span-6 flex flex-wrap gap-2">
                      <UpdateField label="Phone" from={req.profiles?.phone} to={req.phone} />
                      <UpdateField label="Course" from={req.profiles?.course} to={req.course} />
                      <UpdateField label="Branch" from={req.profiles?.branch} to={req.branch} />
                      <UpdateField label="Sec" from={req.profiles?.section} to={req.section} />
                      <UpdateField label="Gender" from={req.profiles?.gender} to={req.gender} />
                    </div>

                    <div className="col-span-3 flex justify-end gap-2">
                      <button onClick={() => handleUpdateRequest(req, 'rejected')} className="p-2 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all" title="Reject Request">
                        <X className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleUpdateRequest(req, 'approved')} className="flex items-center text-xs font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-lg hover:bg-amber-500/30 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <Check className="w-4 h-4 mr-2" /> Approve
                      </button>
                    </div>
                  </motion.div>
                ))}

                {activeTab !== 'updates' && filteredUsers.length === 0 && (
                  <div className="flex flex-col justify-center items-center h-64 text-rose-200/40">
                    <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
                    <p>No {activeTab} users found.</p>
                  </div>
                )}

                {activeTab !== 'updates' && filteredUsers.map((user) => {
                  const showAdminBadge = user.role === 'admin';
                  const appearsAsMember = user.role === 'member' || user.role === 'superadmin';
                  const canManageUser = currentAdmin?.role === 'superadmin' || appearsAsMember;

                  return (
                    <motion.div key={user.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`grid grid-cols-12 gap-4 p-4 items-center rounded-xl transition-all border mb-1 ${activeTab === 'banned' ? 'bg-rose-950/40 border-rose-500/20' : 'bg-transparent hover:bg-black/20 border-transparent hover:border-rose-500/10'}`}>
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/50 border border-rose-500/20 overflow-hidden shrink-0 shadow-inner">
                          {user.profile_photo ? (
                            <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserRound className="w-full h-full p-2 text-rose-300/50" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className={`font-medium text-sm truncate ${activeTab === 'banned' ? 'text-rose-200/50 line-through' : 'text-white'}`}>{user.name}</p>
                          <p className="text-xs text-rose-200/60 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center gap-2">
                        <div>
                          <p className="text-sm text-rose-100/90">{user.course} - {user.branch}</p>
                          <p className="text-xs text-rose-300/50 font-mono">QID: {user.qid}</p>
                        </div>
                        {showAdminBadge && (
                          <span className="ml-2 text-[8px] tracking-[0.2em] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded uppercase shadow-[0_0_10px_rgba(225,29,72,0.2)]">Admin</span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <span className={`font-mono px-2 py-1 rounded border text-sm uppercase shadow-sm ${activeTab === 'banned' ? 'text-rose-300/50 border-rose-900/50 bg-black/40' : 'text-rose-300 bg-rose-500/20 border-rose-500/30'}`}>
                          {user.uid}
                        </span>
                      </div>

                      <div className="col-span-1">
                        <span className="text-[10px] uppercase tracking-widest text-rose-200/70 border border-rose-500/20 bg-black/20 px-2 py-1 rounded-full">
                          {user.hosteler_status === 'Hosteler' ? 'Hostel' : 'Day'}
                        </span>
                      </div>

                      <div className="col-span-3 flex justify-end gap-2">
                        {activeTab === 'pending' && canManageUser && (
                          <>
                            <button onClick={() => handleStatusChange(user, 'rejected')} className="p-2 text-rose-300/50 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"><X className="w-5 h-5" /></button>
                            <button onClick={() => handleStatusChange(user, 'approved')} className="flex items-center text-xs font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"><Check className="w-4 h-4 mr-2" /> Approve</button>
                          </>
                        )}
                        {activeTab === 'approved' && canManageUser && (
                          <button onClick={() => handleStatusChange(user, 'banned')} className="flex items-center text-xs font-bold tracking-widest uppercase text-rose-300 hover:text-white bg-rose-500/20 border border-rose-500/30 px-4 py-2 rounded-lg hover:bg-rose-500/40 transition-all"><Ban className="w-3 h-3 mr-2" /> Ban</button>
                        )}
                        {activeTab === 'banned' && canManageUser && (
                          <button onClick={() => handleStatusChange(user, 'pending')} className="flex items-center text-xs font-bold tracking-widest uppercase text-rose-300/70 hover:text-white border border-rose-500/20 bg-black/40 px-4 py-2 rounded-lg hover:bg-rose-500/20 transition-all"><RotateCcw className="w-3 h-3 mr-2" /> Restore</button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function UpdateField({ label, from, to }: { label: string, from: string, to: string }) {
  const normalizedFrom = from?.toString().trim().toLowerCase() || '';
  const normalizedTo = to?.toString().trim().toLowerCase() || '';
  if (!to || normalizedFrom === normalizedTo) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20 shadow-inner">
      <span className="text-[9px] font-bold uppercase text-amber-200/50 shrink-0">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-amber-200/50 line-through truncate max-w-[80px]">{from || 'Empty'}</span>
        <MoveRight className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-[11px] text-amber-300 font-medium">{to}</span>
      </div>
    </div>
  );
}