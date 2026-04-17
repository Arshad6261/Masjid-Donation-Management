import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, X } from 'lucide-react';

const schema = z.object({
  donor: z.string().min(1, 'दानदाता चुनें'),
  amount: z.number().min(1, 'राशि 0 से ज़्यादा होनी चाहिए'),
  fundType: z.enum(['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam']),
  festivalName: z.string().optional(),
  collectionMethod: z.enum(['walk_in', 'bank_transfer', 'house_visit']).default('walk_in'),
  notes: z.string().optional()
});

export default function AddDonation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [pos, setPos] = useState({});
  const inputRef = useRef(null);

  const { data: donorsSearch } = useQuery({
    queryKey: ['donors', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      const { data } = await api.get(`/donors?search=${searchTerm}&isActive=true`);
      return data;
    },
    enabled: searchTerm.length >= 2
  });

  useEffect(() => {
    setSuggestions(donorsSearch || []);
  }, [donorsSearch]);

  const updatePos = () => {
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, fundType: 'masjid', collectionMethod: 'walk_in' }
  });

  const fundTypeVal = watch('fundType');
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', both: 'दोनों', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };

  const mutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/donations', {
        ...data,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    },
    onSuccess: (res) => {
      reset();
      setSelectedDonor(null);
      setSearchTerm('');
      setSuggestions([]);
      toast.success(`चंदा सेव हुआ · ${res.data.receiptNo}`);
      queryClient.invalidateQueries(['donations']);
      navigate(`/receipt/${res.data.receiptNo}`);
    },
    onError: () => toast.error('चंदा बनाने में त्रुटि')
  });

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor);
    setSearchTerm('');
    setSuggestions([]);
    setValue('donor', donor._id);
    setValue('amount', donor.monthlyAmount);
    setValue('fundType', donor.fundType === 'both' ? 'masjid' : donor.fundType);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">नया चंदा</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        {/* Donor Search with Portal */}
        <div className="mb-8 relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">नाम या फोन से दानदाता खोजें</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              ref={inputRef}
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); updatePos(); }}
              onFocus={updatePos}
              placeholder="जैसे अली या 9876..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none"
            />
          </div>
        </div>

        {/* Portal dropdown */}
        {suggestions.length > 0 && createPortal(
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-xl max-h-60 overflow-y-auto"
          >
            {suggestions.map(d => (
              <div 
                key={d._id}
                onMouseDown={(e) => { e.preventDefault(); handleSelectDonor(d); }}
                className="p-3 hover:bg-dargah-cream border-b border-slate-100 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.phone} · {d.area} · ₹{d.monthlyAmount}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                  d.fundType === 'masjid' ? 'bg-green-50 text-green-800' : 
                  d.fundType === 'dargah' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                }`}>{fundLabels[d.fundType] || d.fundType}</span>
              </div>
            ))}
          </div>,
          document.body
        )}

        {selectedDonor ? (
          <div className="bg-dargah-cream border border-dargah-gold/30 p-4 rounded-xl mb-8 flex justify-between items-center">
            <div>
              <p className="font-bold text-dargah-green-dark">{selectedDonor.name}</p>
              <p className="text-sm text-dargah-teal">{selectedDonor.donorId} · {selectedDonor.area}</p>
            </div>
            <button onClick={() => { setSelectedDonor(null); setValue('donor', ''); }} className="text-sm text-red-600 font-medium px-3 py-1 bg-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 mb-8 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
            आगे बढ़ने के लिए कृपया दानदाता चुनें।
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <input type="hidden" {...register('donor')} />
          {errors.donor && <p className="text-sm text-red-500">{errors.donor.message}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">राशि (₹) *</label>
              <input type="number" {...register('amount', { valueAsNumber: true })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none text-xl font-bold text-slate-900" />
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">फंड प्रकार *</label>
              <select {...register('fundType')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none">
                <option value="masjid">मस्जिद फंड</option>
                <option value="dargah">दरगाह फंड</option>
                <option value="festival">त्यौहार फंड</option>
                <option value="jumma_jholi">जुम्मा झोली</option>
                <option value="tamiri_kaam">तामीरी काम</option>
              </select>
            </div>
            {fundTypeVal === 'festival' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">त्यौहार का नाम *</label>
                <input type="text" {...register('festivalName')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="जैसे रमज़ान 2025" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">वसूली का तरीका</label>
              <select {...register('collectionMethod')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
                <option value="walk_in">स्वयं आकर</option>
                <option value="bank_transfer">बैंक ट्रांसफर</option>
                <option value="house_visit">घर-दौरा</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">नोट</label>
              <input type="text" {...register('notes')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="वैकल्पिक" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!selectedDonor || mutation.isPending}
            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all text-lg ${
              !selectedDonor || mutation.isPending ? 'bg-slate-300' : 'hover:shadow-xl'
            }`}
            style={selectedDonor && !mutation.isPending ? { background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' } : {}}
          >
            {mutation.isPending ? 'प्रोसेस हो रहा है...' : 'सेव करें और रसीद प्रिंट करें'}
          </button>
        </form>
      </div>
    </div>
  );
}
