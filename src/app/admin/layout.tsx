'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Users, Calendar, ClipboardCheck, Settings, 
  ShieldCheck, ArrowLeft, History, Contact2, PieChart, 
  LayoutTemplate
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth');

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!data || !['admin', 'superadmin'].includes(data.role)) {
        return router.push('/dashboard');
      }
      setLoading(false);
    };
    verifyAdmin();
  }, [router]);

  const isActive = (path: string) => pathname === path;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans flex flex-col lg:flex-row relative selection:bg-rose-500/30">
            <div className="fixed inset-0 z-[-1] overflow-hidden">
        {/*background image on the admin panel*/}
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="background" 
          className="w-full h-full object-cover scale-105 opacity-60"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/20 via-black/40 to-black/80" />
      </div>

      {/*desktopsidebar*/}
      <aside className="hidden lg:flex w-72 border-r border-rose-500/10 bg-rose-950/10 backdrop-blur-3xl p-6 flex-col h-screen sticky top-0 z-20 shadow-[10px_0_50px_rgba(225,29,72,0.03)]">
        <div className="mb-10 pl-2">
          <h1 className="text-2xl font-bold tracking-widest text-white">Pahal</h1>
          <p className="text-rose-300 text-[10px] font-bold tracking-[0.2em] uppercase mt-1 flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Core Team
          </p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavButton icon={PieChart} label="Analytics" path="/admin/analytics" active={isActive('/admin/analytics')} router={router} />
          <NavButton icon={Users} label="Approvals" path="/admin" active={isActive('/admin')} router={router} />
          <NavButton icon={Contact2} label="Member Directory" path="/admin/directory" active={isActive('/admin/directory')} router={router} />
          <NavButton icon={Calendar} label="Manage Events" path="/admin/events" active={isActive('/admin/events')} router={router} />
          <NavButton icon={ClipboardCheck} label="Attendance" path="/admin/attendance" active={isActive('/admin/attendance')} router={router} />
          <NavButton icon={History} label="System Logs" path="/admin/logs" active={isActive('/admin/logs')} router={router} />
          <NavButton icon={LayoutTemplate} label="Web Content" path="/admin/content" active={isActive('/admin/content')} router={router} />
        </nav>

        <button onClick={() => router.push('/dashboard')} className="flex items-center w-full px-4 py-3 text-rose-200/50 hover:text-white hover:bg-rose-500/10 rounded-xl transition-all mt-auto border-t border-rose-500/10 pt-6">
          <ArrowLeft className="w-5 h-5 mr-3" /> Return to App
        </button>
      </aside>

      {/*mobile bottomnav*/}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-3xl border-t border-rose-500/20 flex justify-around items-center py-3 px-2 pb-safe shadow-[0_-10px_40px_rgba(225,29,72,0.1)]">
        <MobileNavButton icon={PieChart} label="Data" path="/admin/analytics" active={isActive('/admin/analytics')} router={router} />
        <MobileNavButton icon={Users} label="Approvals" path="/admin" active={isActive('/admin')} router={router} />
        <MobileNavButton icon={Contact2} label="Directory" path="/admin/directory" active={isActive('/admin/directory')} router={router} />
        <MobileNavButton icon={ClipboardCheck} label="Log" path="/admin/attendance" active={isActive('/admin/attendance')} router={router} />
        <MobileNavButton icon={ArrowLeft} label="Exit" path="/dashboard" active={false} router={router} isExit />
      </nav>

      {/*main content*/}
      <main className="flex-1 overflow-y-auto h-screen p-6 lg:p-10 relative pb-24 lg:pb-10">
        <div className="relative z-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
const NavButton = ({ icon: Icon, label, path, active, router }: any) => (
  <button onClick={() => router.push(path)} className={`flex items-center w-full px-4 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 ${active ? 'bg-rose-500/20 text-rose-200 border border-rose-400/20 shadow-[inset_0_0_20px_rgba(225,29,72,0.1)]' : 'text-rose-200/50 hover:bg-rose-500/10 hover:text-rose-100 hover:border-rose-400/10 border border-transparent'}`}>
    <Icon className={`w-5 h-5 mr-3 ${active ? 'opacity-100' : 'opacity-70'}`} /> {label}
  </button>
);
const MobileNavButton = ({ icon: Icon, label, path, active, router, isExit }: any) => (
  <button onClick={() => router.push(path)} className={`flex flex-col items-center transition-colors w-16 ${active ? 'text-rose-300' : isExit ? 'text-rose-200/40 hover:text-white' : 'text-rose-200/50 hover:text-rose-200'}`}>
    <Icon className={`w-5 h-5 mb-1 ${active ? 'opacity-100 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]' : 'opacity-70'}`} />
    <span className="text-[9px] font-bold tracking-wider uppercase">{label}</span>
  </button>
);