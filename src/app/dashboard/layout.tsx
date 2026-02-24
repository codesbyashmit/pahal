'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, MapPin, Calendar, UserRound, BookOpen, 
  LogOut, PieChart
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth');

      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', session.user.id)
        .single();

      if (!data || data.status === 'pending') {
        return router.push('/pending');
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  const isActive = (path: string) => pathname === path;

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-300 border-t-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-rose-950 font-sans selection:bg-rose-500/30">
      
      {/*background image*/}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-rose-50/50">
        <img src="https://lffyofetgnpuvnjyoaln.supabase.co/storage/v1/object/public/website_assets/texturebgdashboard.jpeg" alt="Background" className="w-full h-full object-cover opacity-80" /> 
        <div className="absolute inset-0 bg-gradient-to-br from-rose-200/20 via-transparent to-rose-400/10" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 min-h-screen pb-24 lg:pb-8">
        
        {/*left column*/}
        <aside className="hidden lg:flex lg:col-span-3 flex-col h-full sticky top-8 gap-6">
          <div className="bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2.5rem] p-6 flex flex-col min-h-[80vh] shadow-[0_8px_32px_rgba(225,29,72,0.15)] relative overflow-hidden">
            
            <div className="mb-10 cursor-pointer relative z-10 px-2" onClick={() => router.push('/')}>
              <h1 className="text-3xl font-serif font-bold tracking-widest drop-shadow-sm text-rose-950">Pahal</h1>
              <p className="text-rose-600 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">Member Portal</p>
            </div>

            <nav className="flex flex-col gap-2 flex-1 mb-8 relative z-10">
              <NavButton icon={Home} label="Dashboard" path="/dashboard" active={isActive('/dashboard')} router={router} />
              <NavButton icon={MapPin} label="Village Drives" path="/dashboard/drives" active={isActive('/dashboard/drives')} router={router} />
              <NavButton icon={Calendar} label="Campus Events" path="/dashboard/events" active={isActive('/dashboard/events')} router={router} />
              <NavButton icon={BookOpen} label="Resources" path="/dashboard/resources" active={isActive('/dashboard/resources')} router={router} />
              <NavButton icon={PieChart} label="Attendance" path="/dashboard/attendance" active={isActive('/dashboard/attendance')} router={router} />
              <NavButton icon={UserRound} label="My Profile" path="/dashboard/profile" active={isActive('/dashboard/profile')} router={router} />
            </nav>

            <button onClick={handleSignOut} className="flex items-center w-full px-4 py-4 text-rose-900/70 font-bold tracking-widest text-xs uppercase hover:text-rose-800 hover:bg-rose-500/10 rounded-2xl transition-all mt-auto border-t border-rose-400/20 pt-6 relative z-10">
              <LogOut className="w-4 h-4 mr-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/*bottomnav for mobile */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50 bg-rose-500/10 backdrop-blur-lg border border-rose-400/30 rounded-[2rem] flex justify-around items-center py-4 px-2 shadow-[0_-8px_32px_rgba(225,29,72,0.15)]">
          <MobileNavButton icon={Home} label="Home" path="/dashboard" active={isActive('/dashboard')} router={router} />
          <MobileNavButton icon={MapPin} label="Drives" path="/dashboard/drives" active={isActive('/dashboard/drives')} router={router} />
          <MobileNavButton icon={Calendar} label="Events" path="/dashboard/events" active={isActive('/dashboard/events')} router={router} />
          <MobileNavButton icon={PieChart} label="Stats" path="/dashboard/attendance" active={isActive('/dashboard/attendance')} router={router} />
          <MobileNavButton icon={UserRound} label="Profile" path="/dashboard/profile" active={isActive('/dashboard/profile')} router={router} />
        </nav>
        
        <div className="lg:col-span-9 relative z-10">
          {children}
        </div>

      </div>
    </div>
  );
}

const NavButton = ({ icon: Icon, label, path, active, router }: any) => (
  <button 
    onClick={() => router.push(path)} 
    className={`flex items-center w-full px-5 py-3.5 rounded-2xl font-medium tracking-wide transition-all ${
      active 
        ? 'bg-rose-500/20 text-rose-900 border border-rose-400/40 shadow-inner' 
        : 'text-rose-900/60 hover:bg-rose-500/10 hover:text-rose-900 border border-transparent'
    }`}
  >
    <Icon className={`w-5 h-5 mr-4 ${active ? 'opacity-100 text-rose-600' : 'opacity-70'}`} /> 
    {label}
  </button>
);

const MobileNavButton = ({ icon: Icon, label, path, active, router }: any) => (
  <button 
    onClick={() => router.push(path)} 
    className={`flex flex-col items-center transition-all ${active ? 'text-rose-700 scale-105' : 'text-rose-900/60 hover:text-rose-900'}`}
  >
    <Icon className={`w-6 h-6 mb-1.5 ${active ? 'opacity-100 drop-shadow-md' : 'opacity-70'}`} />
    <span className="text-[9px] font-bold tracking-widest uppercase">{label}</span>
  </button>
);