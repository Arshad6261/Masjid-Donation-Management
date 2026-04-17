import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  fundType: z.enum(['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam']),
  festivalName: z.string().optional(),
  category: z.string().min(1, 'श्रेणी ज़रूरी है'),
  description: z.string().min(1, 'विवरण ज़रूरी है'),
  amount: z.number().min(1, 'राशि 0 से ज़्यादा होनी चाहिए'),
  vendor: z.string().optional(),
  notes: z.string().optional()
});

const COMMON_CATEGORIES = ['इमाम वेतन', 'बिज़ली', 'पानी', 'रखरखाव', 'साफ़-सफ़ाई', 'आयोजन', 'निर्माण कार्य'];

export default function AddExpenditure() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCustom, setShowCustom] = useState(false);

  // Fetch previously used categories for suggestions
  const { data: usedCategories } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => { const { data } = await api.get('/expenditures?limit=200'); return data; },
    select: (data) => {
      const cats = [...new Set(data.map(e => e.category).filter(Boolean))];
      // Merge common + used, deduplicate
      const all = [...new Set([...COMMON_CATEGORIES, ...cats])];
      return all;
    }
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fundType: 'masjid', amount: 0 }
  });

  const fundTypeVal = watch('fundType');
  const categoryVal = watch('category');

  const mutation = useMutation({
    mutationFn: async (data) => await api.post('/expenditures', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenditures']);
      queryClient.invalidateQueries(['expenseCategories']);
      toast.success('खर्चा दर्ज हुआ');
      navigate('/expenditures');
    },
    onError: () => toast.error('खर्चा दर्ज करने में त्रुटि')
  });

  const categories = usedCategories || COMMON_CATEGORIES;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">नया खर्चा</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">फंड प्रकार *</label>
              <select {...register('fundType')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
                <option value="masjid">मस्जिद फंड</option>
                <option value="dargah">दरगाह फंड</option>
                <option value="festival">त्यौहार फंड</option>
                <option value="jumma_jholi">जुम्मा झोली</option>
                <option value="tamiri_kaam">तामीरी काम</option>
              </select>
            </div>
            {fundTypeVal === 'festival' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">त्यौहार का नाम *</label>
                <input type="text" {...register('festivalName')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="जैसे रमज़ान 2025" required />
              </div>
            )}

            {/* Category — chip selection + custom input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">श्रेणी *</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => { setValue('category', cat); setShowCustom(false); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      categoryVal === cat && !showCustom ? 'bg-dargah-green text-white border-dargah-green shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-dargah-green/50'
                    }`}>{cat}</button>
                ))}
                <button type="button" onClick={() => { setShowCustom(true); setValue('category', ''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    showCustom ? 'bg-dargah-gold text-white border-dargah-gold shadow-sm' : 'bg-white text-dargah-gold border-dargah-gold/30 hover:border-dargah-gold'
                  }`}>+ अपनी श्रेणी</button>
              </div>
              {showCustom && (
                <input type="text" {...register('category')} className="w-full px-4 py-3 bg-white border border-dargah-gold/40 rounded-xl outline-none focus:ring-2 focus:ring-dargah-gold/30" placeholder="अपनी श्रेणी लिखें..." autoFocus />
              )}
              <input type="hidden" {...(showCustom ? {} : register('category'))} />
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">राशि (₹) *</label>
              <input type="number" {...register('amount', { valueAsNumber: true })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xl font-bold text-slate-900" />
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">विवरण *</label>
              <input type="text" {...register('description')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="खर्चे का विवरण दें" />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">विक्रेता / दुकानदार</label>
              <input type="text" {...register('vendor')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="वैकल्पिक" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">नोट</label>
              <input type="text" {...register('notes')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="वैकल्पिक" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all text-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          >
            {mutation.isPending ? 'सेव हो रहा है...' : 'खर्चा दर्ज करें'}
          </button>
        </form>
      </div>
    </div>
  );
}
