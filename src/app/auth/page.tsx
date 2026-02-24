'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmailSent, setCheckEmailSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, status')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.status === 'pending') router.push('/pending');
          else router.push('/dashboard'); 
        } else {
          router.push('/onboarding');
        }
      }
    };
    
    checkUserSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, status')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.status === 'pending') router.push('/pending');
          else router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        setCheckEmailSent(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10 font-sans text-rose-950">
      
      {/*background image with blur*/}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-rose-50">
        <img 
          src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2564&auto=format&fit=crop" 
          alt="Background Texture" 
          className="w-full h-full object-cover opacity-70 scale-105"
        />
        {/*blur*/}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[60px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 via-transparent to-rose-200/20" />
      </div>

      {/*frostglass */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_10px_40px_rgba(225,29,72,0.1)] overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {checkEmailSent ? (
            <motion.div 
              key="check-email"
              initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/30 border border-white/50 flex items-center justify-center shadow-inner">
                  <MailCheck className="text-rose-500 w-8 h-8" />
                </div>
              </div>
              <h2 className="font-serif text-3xl text-rose-950 mb-4 drop-shadow-sm">Check your inbox</h2>
              <p className="text-rose-900/70 text-sm leading-relaxed mb-8 font-light">
                We just sent a verification link to <span className="text-rose-950 font-medium">{email}</span>. Click the link to verify your account and continue onboarding.
              </p>
              <button 
                onClick={() => setCheckEmailSent(false)}
                className="text-xs tracking-widest text-rose-600 font-bold uppercase hover:text-rose-800 transition-colors"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div key="auth-form" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
              <div className="text-center mb-8">
                <h1 className="font-serif text-4xl text-rose-950 mb-2 drop-shadow-sm">{isSignUp ? 'Join Pahal' : 'Welcome Back'}</h1>
                <p className="text-rose-900/60 text-sm font-light">Use your email to continue</p>
              </div>

              {error && <p className="text-rose-600 text-xs text-center mb-4 bg-white/40 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-sm">{error}</p>}

              <form onSubmit={handleAuth} className="space-y-4">
                <input 
                  type="email" placeholder="Email Address" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:outline-none focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all shadow-sm"
                />
                <input 
                  type="password" placeholder="Password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-4 text-rose-950 placeholder:text-rose-950/40 focus:outline-none focus:bg-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all shadow-sm"
                />
                <button 
                  disabled={loading}
                  className="w-full bg-rose-500 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-2xl hover:bg-rose-600 transition-all flex justify-center items-center shadow-lg shadow-rose-500/20 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>
              <p className="text-center text-rose-900/60 text-sm mt-6 font-light">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-rose-600 font-bold hover:text-rose-800 transition-colors ml-1">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}