import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AreaInput from '../components/AreaInput';

const schema = z.object({
  donor: z.string().optional(),
  amount: z.number().min(1, 'राशि 0 से ज़्यादा होनी चाहिए'),
  fundType: z.enum(['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam']),
  festivalName: z.string().optional(),
  collectionMethod: z.enum(['walk_in', 'bank_transfer', 'house_visit']).default('walk_in'),
  notes: z.string().optional(),
  walkInDonorName: z.string().optional()
});

export default function AddDonation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [pos, setPos] = useState({});
  const inputRef = useRef(null);

  const [donationMode, setDonationMode] = useState('standard');
  const [totalMonths, setTotalMonths] = useState(2);

  // New Donor Form State
  const [showNewDonorForm, setShowNewDonorForm] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: '', phone: '', area: '', fundType: 'masjid', monthlyAmount: 0
  });

  // Unknown Donor State
  const [isUnknownDonor, setIsUnknownDonor] = useState(false);
  const [isAnonymousPref, setIsAnonymousPref] = useState(false);

  const { data: donorsSearch, isLoading: isSearching } = useQuery({
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
    defaultValues: { amount: 0, fundType: 'masjid', collectionMethod: 'walk_in', walkInDonorName: '' }
  });

  const fundTypeVal = watch('fundType');
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', both: 'दोनों', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };

  // Adjust collectionDate specifically for jumma_jholi
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const basePayload = {
        ...data,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        paymentDate: fundTypeVal === 'jumma_jholi' ? collectionDate : undefined,
        isUnknownDonor,
        isAnonymous: isAnonymousPref,
        walkInDonorName: data.walkInDonorName
      };

      if (donationMode === 'advance') {
        return await api.post('/donations/advance', {
          donor: data.donor,
          monthlyAmount: data.amount,
          fundType: data.fundType,
          festivalName: data.festivalName,
          startMonth: basePayload.month,
          startYear: basePayload.year,
          totalMonths,
          collectionMethod: data.collectionMethod,
          notes: data.notes
        });
      } else {
        return await api.post('/donations', basePayload);
      }
    },
    onSuccess: (res) => {
      reset();
      setSelectedDonor(null);
      setSearchTerm('');
      setSuggestions([]);
      setIsUnknownDonor(false);
      
      if (donationMode === 'advance') {
        toast.success(`अग्रिम चंदा सेव हुआ (${res.data.donations.length} महीने)`);
        queryClient.invalidateQueries(['donations']);
        navigate(`/receipt/${res.data.donations[0].receiptNo}`);
      } else {
        toast.success(`चंदा सेव हुआ · ${res.data.receiptNo}`);
        queryClient.invalidateQueries(['donations']);
        navigate(`/receipt/${res.data.receiptNo}`);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'चंदा बनाने में त्रुटि')
  });

  const createDonorMutation = useMutation({
    mutationFn: async (donorData) => {
      const { data } = await api.post('/donors', { ...donorData, isActive: true });
      return data;
    },
    onSuccess: (newDonorDoc) => {
      toast.success('नया दानदाता जुड़ गया!');
      handleSelectDonor(newDonorDoc);
      setShowNewDonorForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'दानदाता जोड़ने में त्रुटि')
  });

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor);
    setSearchTerm('');
    setSuggestions([]);
    setValue('donor', donor._id);
    setValue('amount', donor.monthlyAmount || 0);
    if (donor.fundType) {
      setValue('fundType', donor.fundType === 'both' ? 'masjid' : donor.fundType);
    }
  };

  const isJummaTholi = fundTypeVal === 'jumma_jholi';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">नया चंदा</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        
        {/* Fund Type - We moved it up to handle Jumma Tholi logic first */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">फंड प्रकार *</label>
          <select {...register('fundType')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none">
            <option value="masjid">मस्जिद फंड</option>
            <option value="dargah">दरगाह फंड</option>
            <option value="festival">त्यौहार फंड</option>
            {user?.role === 'admin' && <option value="jumma_jholi">जुम्मा झोली (Jumma Tholi)</option>}
            <option value="tamiri_kaam">तामीरी काम</option>
          </select>
        </div>

        {isJummaTholi && (
          <div className="p-4 mb-6 bg-purple-50 text-purple-800 text-sm rounded-xl border border-purple-200 flex flex-col gap-2">
            <p><strong>ℹ जुम्मा झोली</strong> एक सामान्य चंदा है। इसके लिए किसी दानदाता प्रोफ़ाइल की आवश्यकता नहीं है।</p>
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">कलेक्शन की तारीख (शुक्रवार)</label>
              <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="w-full px-4 py-2 border border-purple-300 rounded-lg outline-none" />
            </div>
          </div>
        )}

        {/* DONOR SECTION */}
        {!isJummaTholi && !isUnknownDonor && !showNewDonorForm && !selectedDonor && (
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
            
            {/* Quick Links below search */}
            <div className="flex flex-col gap-2 mt-3 text-sm">
              {searchTerm.length >= 2 && !isSearching && suggestions.length === 0 && (
                <button type="button" onClick={() => setShowNewDonorForm(true)} className="text-left text-dargah-green font-semibold hover:underline">
                  + नया दानदाता जोड़ें (Add new donor and continue)
                </button>
              )}
              <button type="button" onClick={() => setIsUnknownDonor(true)} className="text-left text-slate-500 font-medium hover:underline">
                गुमनाम / स्वयं आकर (Record from unknown/walk-in person)
              </button>
              
              <label className="flex items-center gap-2 mt-2 text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAnonymousPref}
                  onChange={(e) => setIsAnonymousPref(e.target.checked)}
                  className="w-4 h-4 text-dargah-green rounded focus:ring-dargah-green"
                />
                <span>यह दानदाता गुमनाम (Anonymous) रहना चाहता है</span>
              </label>
              
              {isAnonymousPref && (
                <div className="p-3 mt-1 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-200">
                  <strong>सूचना:</strong> रसीद और रिपोर्ट में इस दानदाता का नाम "Anonymous Donor" (गुमनाम) के रूप में दिखाई देगा, हालांकि सिस्टम में रिकॉर्ड के लिए दानदाता का चुनाव ज़रूरी है।
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portal dropdown */}
        {!isJummaTholi && suggestions.length > 0 && !isUnknownDonor && !showNewDonorForm && !selectedDonor && createPortal(
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

        {/* Selected Donor State */}
        {!isJummaTholi && selectedDonor && !isUnknownDonor && !showNewDonorForm && (
          <div className="bg-dargah-cream border border-dargah-gold/30 p-4 rounded-xl mb-8 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-dargah-green-dark">{selectedDonor.name}</p>
                <p className="text-sm text-dargah-teal">{selectedDonor.donorId} · {selectedDonor.area}</p>
              </div>
              <button type="button" onClick={() => { setSelectedDonor(null); setValue('donor', ''); }} className="text-sm text-red-600 font-medium px-3 py-1 bg-white rounded-lg hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Split Control for Mode */}
            <div className="flex bg-white/50 p-1 rounded-xl border border-dargah-gold/20">
              <button
                type="button"
                onClick={() => setDonationMode('standard')}
                className={`flex-1 py-1.5 text-sm font-bold transition-all rounded-lg ${donationMode === 'standard' ? 'bg-dargah-green text-white shadow-sm' : 'text-slate-600 hover:text-dargah-green'}`}
              >
                1 माह (Standard)
              </button>
              <button
                type="button"
                onClick={() => setDonationMode('advance')}
                className={`flex-1 py-1.5 text-sm font-bold transition-all rounded-lg ${donationMode === 'advance' ? 'bg-dargah-green text-white shadow-sm' : 'text-slate-600 hover:text-dargah-green'}`}
              >
                अग्रिम (Advance)
              </button>
            </div>
          </div>
        )}

        {/* Walk-In Donor View */}
        {!isJummaTholi && isUnknownDonor && (
          <div className="p-5 mb-8 bg-slate-50 border border-slate-200 rounded-xl relative">
            <button type="button" onClick={() => setIsUnknownDonor(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-800 mb-1">Walk-in / गुमनाम</h3>
            <p className="text-xs text-slate-500 mb-4">यह चंदा किसी प्रोफ़ाइल से नहीं जुड़ेगा।</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">नाम (वैकल्पिक)</label>
            <input type="text" {...register('walkInDonorName')} placeholder="जैसे मोहम्मद रज़ा" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
        )}

        {/* New Donor Mini Form */}
        {!isJummaTholi && showNewDonorForm && (
          <div className="p-5 mb-8 bg-green-50/50 border border-dargah-green/20 rounded-xl relative">
            <button type="button" onClick={() => setShowNewDonorForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-dargah-green-dark mb-4">नया दानदाता जोड़ें</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">नाम *</label>
                <input type="text" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">फ़ोन</label>
                <input type="text" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">क्षेत्र *</label>
                <AreaInput value={newDonor.area} onChange={v => setNewDonor({...newDonor, area: v})} placeholder="क्षेत्र चुनें" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">मासिक राशि</label>
                <input type="number" value={newDonor.monthlyAmount} onChange={e => setNewDonor({...newDonor, monthlyAmount: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
              </div>
            </div>
            <button type="button" disabled={!newDonor.name || !newDonor.area || createDonorMutation.isPending} onClick={() => createDonorMutation.mutate(newDonor)} className="mt-4 bg-dargah-green text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {createDonorMutation.isPending ? 'जोड़ रहे हैं...' : 'सेव करें व चुनें'}
            </button>
          </div>
        )}

        {/* Error logic if none selected */}
        {!isJummaTholi && !selectedDonor && !isUnknownDonor && !showNewDonorForm && (
          <div className="p-4 mb-8 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
            आगे बढ़ने के लिए कृपया दानदाता चुनें।
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <input type="hidden" {...register('donor')} />
          {errors.donor && <p className="text-sm text-red-500">{errors.donor.message}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">राशि (₹) {donationMode === 'advance' ? 'प्रति माह' : ''} *</label>
              <input type="number" {...register('amount', { valueAsNumber: true })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none text-xl font-bold text-slate-900" />
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            
            {donationMode === 'advance' && !isJummaTholi && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">कुल महीने (2-12) *</label>
                <input 
                  type="number" 
                  min="2" 
                  max="12" 
                  value={totalMonths}
                  onChange={(e) => setTotalMonths(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none font-bold text-slate-900" 
                />
              </div>
            )}
            
            {fundTypeVal === 'festival' && (
              <div className="md:col-span-2">
                <FestivalNameInput register={register} setValue={setValue} watch={watch} />
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
            disabled={(!selectedDonor && !isUnknownDonor && !isJummaTholi) || mutation.isPending}
            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all text-lg ${
              (!selectedDonor && !isUnknownDonor && !isJummaTholi) || mutation.isPending ? 'bg-slate-300' : 'hover:shadow-xl'
            }`}
            style={(selectedDonor || isUnknownDonor || isJummaTholi) && !mutation.isPending ? { background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' } : {}}
          >
            {mutation.isPending ? 'प्रोसेस हो रहा है...' : 'सेव करें और रसीद प्रिंट करें'}
          </button>
        </form>
      </div>
    </div>
  );
}

function FestivalNameInput({ register, setValue, watch }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const festivalVal = watch('festivalName') || '';

  const { data: festivals } = useQuery({
    queryKey: ['festivalNames'],
    queryFn: async () => {
      const { data } = await api.get('/donations/festivals');
      return data;
    }
  });

  // Common/preset festival names to always show as suggestions
  const presetFestivals = [
    'रमज़ान', 'ईद-उल-फ़ित्र', 'ईद-उल-अज़हा', 'शब-ए-बारात', 'शब-ए-मेराज',
    'मिलाद-उन-नबी', 'मुहर्रम', 'उर्स शरीफ़'
  ];

  // Merge preset + DB festivals, deduplicate
  const allFestivals = [...new Set([...(festivals || []), ...presetFestivals])];

  // Filter based on what user has typed
  const filtered = festivalVal.length > 0
    ? allFestivals.filter(f => f.toLowerCase().includes(festivalVal.toLowerCase()))
    : allFestivals;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">त्यौहार का नाम *</label>
      <input
        type="text"
        {...register('festivalName')}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        autoComplete="off"
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-dargah-green/30"
        placeholder="जैसे रमज़ान, ईद-उल-फ़ित्र, उर्स शरीफ़..."
        required
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
          {filtered.map(f => (
            <div
              key={f}
              onMouseDown={(e) => {
                e.preventDefault();
                setValue('festivalName', f);
                setShowDropdown(false);
              }}
              className="px-4 py-3 hover:bg-dargah-cream cursor-pointer border-b border-slate-50 last:border-0 text-sm font-medium text-slate-800"
            >
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
