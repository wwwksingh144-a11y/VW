'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/app/actions/adminAuth';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginAdmin(password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 text-warm-50 font-sans">
      <div className="w-full max-w-md bg-navy-900/50 p-8 rounded-2xl border border-navy-800 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-navy-950 rounded-2xl border border-navy-800 flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-bronze-500" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Mission Control Access</h1>
          <p className="text-sm text-navy-400 mt-2 font-mono uppercase tracking-widest text-center">
            Secondary Authentication Required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono font-medium text-navy-300 uppercase tracking-wider block">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-navy-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-navy-950 border border-navy-800 rounded-xl focus:ring-2 focus:ring-bronze-500/50 focus:border-bronze-500 transition-all outline-none text-warm-50 placeholder-navy-600"
                placeholder="Enter your administrative password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-bronze-600 hover:bg-bronze-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-bronze-900/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Authenticate Session</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
