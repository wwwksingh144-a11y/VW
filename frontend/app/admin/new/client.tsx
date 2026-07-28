'use client'

import { useState } from 'react';
import { ShieldCheck, Mail, User, Shield, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { initiatePromotion, verifyPromotion } from '@/app/actions/adminPromotion';

export default function NewAdminClient() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  
  // OTP Data
  const [superAdminOtp, setSuperAdminOtp] = useState('');
  const [promotedOtp, setPromotedOtp] = useState('');
  const [password, setPassword] = useState('');

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await initiatePromotion(name, email, role);
    if (res.error) {
      setError(res.error);
    } else {
      setStep(2);
      setSuccess('OTPs sent successfully. Check your Super Admin email and the user\'s email.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    const res = await verifyPromotion(email, superAdminOtp, promotedOtp, password);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Promotion successful. The user is now an admin.');
      setStep(1);
      setName('');
      setEmail('');
      setSuperAdminOtp('');
      setPromotedOtp('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-bronze-950/30 rounded-2xl border border-bronze-900/50 flex items-center justify-center mb-4 text-bronze-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-navy-950">Promote to Admin</h1>
        <p className="text-navy-500 font-mono text-sm mt-2 uppercase tracking-widest">Dual-OTP Security Protocol</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-navy-100 shadow-xl shadow-navy-900/5">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleInitiate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-navy-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 focus:border-bronze-500 outline-none text-navy-900" placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-navy-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 focus:border-bronze-500 outline-none text-navy-900" placeholder="john@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Admin Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-5 w-5 text-navy-400" />
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 focus:border-bronze-500 outline-none text-navy-900 appearance-none">
                  <option value="Admin">Admin (Full Dashboard Access)</option>
                  <option value="SEO">SEO / Blog Writer</option>
                  <option value="Content Manager">Content Manager</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-navy-950 hover:bg-navy-900 text-white rounded-xl font-medium transition-all shadow-lg active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Initiating...' : 'Verify & Send OTPs'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Super Admin OTP</label>
              <input type="text" value={superAdminOtp} onChange={e => setSuperAdminOtp(e.target.value)} required className="w-full px-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl text-center tracking-[0.5em] font-mono text-lg outline-none focus:border-bronze-500" placeholder="------" maxLength={6} />
              <p className="text-xs text-navy-400 text-center">Sent to your email</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">User's OTP</label>
              <input type="text" value={promotedOtp} onChange={e => setPromotedOtp(e.target.value)} required className="w-full px-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl text-center tracking-[0.5em] font-mono text-lg outline-none focus:border-bronze-500" placeholder="------" maxLength={6} />
              <p className="text-xs text-navy-400 text-center">Sent to {email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Assign Initial Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-navy-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 focus:border-bronze-500 outline-none text-navy-900" placeholder="Must be securely shared with user" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Verifying...' : 'Complete Promotion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
