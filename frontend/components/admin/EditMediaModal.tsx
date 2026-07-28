'use client'

import { useState } from 'react';
import { updateMedia } from '@/app/actions/mediaActions';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

export function EditMediaModal({ media, type, onClose, onRefresh }: { media: any, type: 'photos' | 'videos', onClose: () => void, onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    heading: media.heading || '',
    subHeading: media.subHeading || '',
    description: media.description || '',
    category: media.category || '',
    publishStatus: media.publishStatus || 'draft',
    isStarred: media.isStarred || false,
    displayOrder: media.displayOrder || 0,
    altText: media.altText || '', // Only for photos
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await updateMedia(type, media.id, {
      ...formData,
      displayOrder: parseInt(formData.displayOrder as any, 10)
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-navy-100 flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-navy-950">Edit {type === 'photos' ? 'Photo' : 'Video'} Details</h2>
          <button onClick={onClose} className="p-2 text-navy-400 hover:text-navy-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form id="edit-media-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Heading</label>
                <input type="text" value={formData.heading} onChange={e => setFormData({...formData, heading: e.target.value})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Sub Heading</label>
                <input type="text" value={formData.subHeading} onChange={e => setFormData({...formData, subHeading: e.target.value})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-navy-500 uppercase">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
            </div>

            {type === 'photos' && (
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Alt Text (Accessibility & SEO)</label>
                <input type="text" value={formData.altText} onChange={e => setFormData({...formData, altText: e.target.value})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Publish Status</label>
                <select value={formData.publishStatus} onChange={e => setFormData({...formData, publishStatus: e.target.value})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-navy-500 uppercase">Display Order (Lower = First)</label>
                <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value, 10)})} className="w-full px-4 py-2 bg-warm-50 border border-navy-200 rounded-xl focus:ring-2 focus:ring-bronze-500 outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="isStarred" checked={formData.isStarred} onChange={e => setFormData({...formData, isStarred: e.target.checked})} className="w-5 h-5 rounded border-navy-300 text-bronze-600 focus:ring-bronze-500" />
                <label htmlFor="isStarred" className="text-sm font-medium text-navy-700 cursor-pointer">Starred / Featured</label>
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-navy-100 flex justify-end gap-3 bg-warm-50 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors">
            Cancel
          </button>
          <button form="edit-media-form" type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-bronze-600 rounded-xl hover:bg-bronze-500 transition-colors flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
