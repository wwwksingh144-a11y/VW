'use client'

import { useState, useEffect } from 'react';
import { ShieldCheck, Save, Loader2, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContentSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vwapi.onrender.com';
      const res = await fetch(`${backendUrl}/api/settings`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vwapi.onrender.com';
      const token = document.cookie.split('; ').find(row => row.startsWith('admin_session='))?.split('=')[1];
      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Settings saved successfully. Refresh homepage to see changes.');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (e) {
      setMessage('Error saving settings.');
    }
    setSaving(false);
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-navy-200/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-bronze-100/50 border border-bronze-200/50 text-bronze-800 text-[10px] font-mono font-bold w-fit uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-navy-950 tracking-tight">Site Settings</h1>
          <p className="text-sm font-mono text-navy-500">Edit dynamic text blocks across the site.</p>
        </div>
        
        <Button variant="secondary" onClick={fetchSettings} disabled={loading} className="gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 text-navy-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-warm-50/50 p-6 md:p-8 rounded-2xl border border-navy-200/60 shadow-sm space-y-6">
          {message && (
            <div className={`p-4 rounded-xl border text-sm font-medium ${message.includes('success') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-navy-950 border-b border-navy-200 pb-2">Homepage: Featured Videos Section</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-600 uppercase tracking-wider">Title Line 1</label>
              <input 
                type="text" 
                value={settings.featured_videos_title_line1 ?? "Brand Stories in"}
                onChange={(e) => handleChange('featured_videos_title_line1', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none transition-all font-medium text-navy-950"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-600 uppercase tracking-wider">Title Line 2 (Highlighted)</label>
              <input 
                type="text" 
                value={settings.featured_videos_title_line2 ?? "High-Definition Motion."}
                onChange={(e) => handleChange('featured_videos_title_line2', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none transition-all font-medium text-navy-950"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-600 uppercase tracking-wider">Description Paragraph</label>
              <textarea 
                rows={3}
                value={settings.featured_videos_description ?? "We give wings to your vision through 4K commercial cinematography, high-converting launch films, and viral performance ads."}
                onChange={(e) => handleChange('featured_videos_description', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none transition-all font-medium text-navy-950 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-navy-200 flex justify-end">
            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
